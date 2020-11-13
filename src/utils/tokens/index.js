import {
  PublicKey,
  SystemProgram,
  Transaction,
  Account,
} from '@solana/web3.js';
import {
  assertOwner,
  closeAccount,
  initializeAccount,
  initializeMint,
  memoInstruction,
  mintTo,
  TOKEN_PROGRAM_ID,
  transfer,
} from './instructions';
import {
  ACCOUNT_LAYOUT,
  getOwnedAccountsFilters,
  MINT_LAYOUT,
  parseTokenAccountData,
} from './data';
import bs58 from 'bs58';

export async function getOwnedTokenAccounts(connection, publicKey) {
  let filters = getOwnedAccountsFilters(publicKey);
  let resp = await connection._rpcRequest('getProgramAccounts', [
    TOKEN_PROGRAM_ID.toBase58(),
    {
      commitment: connection.commitment,
      filters,
    },
  ]);
  if (resp.error) {
    throw new Error(
      'failed to get token accounts owned by ' +
        publicKey.toBase58() +
        ': ' +
        resp.error.message,
    );
  }
  return resp.result
    .map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
      publicKey: new PublicKey(pubkey),
      accountInfo: {
        data: bs58.decode(data),
        executable,
        owner: new PublicKey(owner),
        lamports,
      },
    }))
    .filter(({ accountInfo }) => {
      // TODO: remove this check once mainnet is updated
      return filters.every((filter) => {
        if (filter.dataSize) {
          return accountInfo.data.length === filter.dataSize;
        } else if (filter.memcmp) {
          let filterBytes = bs58.decode(filter.memcmp.bytes);
          return accountInfo.data
            .slice(
              filter.memcmp.offset,
              filter.memcmp.offset + filterBytes.length,
            )
            .equals(filterBytes);
        }
        return false;
      });
    });
}

export async function createAndInitializeMint({
  connection,
  owner, // Account for paying fees and allowed to mint new tokens
  mint, // Account to hold token information
  amount, // Number of tokens to issue
  decimals,
  initialAccount, // Account to hold newly issued tokens, if amount > 0
}) {
  let transaction = new Transaction();
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: owner.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MINT_LAYOUT.span,
      ),
      space: MINT_LAYOUT.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );
  transaction.add(
    initializeMint({
      mint: mint.publicKey,
      decimals,
      mintAuthority: owner.publicKey,
    }),
  );
  let signers = [owner, mint];
  if (amount > 0) {
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: initialAccount.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
          ACCOUNT_LAYOUT.span,
        ),
        space: ACCOUNT_LAYOUT.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
    signers.push(initialAccount);
    transaction.add(
      initializeAccount({
        account: initialAccount.publicKey,
        mint: mint.publicKey,
        owner: owner.publicKey,
      }),
    );
    transaction.add(
      mintTo({
        mint: mint.publicKey,
        destination: initialAccount.publicKey,
        amount,
        mintAuthority: owner.publicKey,
      }),
    );
  }
  return await connection.sendTransaction(transaction, signers, {
    preflightCommitment: 'single',
  });
}

export async function createAndInitializeTokenAccount({
  connection,
  payer,
  mintPublicKey,
  newAccount,
}) {
  let transaction = new Transaction();
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        ACCOUNT_LAYOUT.span,
      ),
      space: ACCOUNT_LAYOUT.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );
  transaction.add(
    initializeAccount({
      account: newAccount.publicKey,
      mint: mintPublicKey,
      owner: payer.publicKey,
    }),
  );
  let signers = [payer, newAccount];
  return await connection.sendTransaction(transaction, signers, {
    preflightCommitment: 'single',
  });
}

export async function transferTokens({
  connection,
  owner,
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memo,
  mint,
}) {
  const destinationAccountInfo = await connection.getAccountInfo(
    destinationPublicKey,
  );
  if (!!destinationAccountInfo && destinationAccountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    return await transferBetweenSplTokenAccounts({
      connection,
      owner,
      sourcePublicKey,
      destinationPublicKey,
      amount,
      memo,
    });
  }
  if (!destinationAccountInfo || destinationAccountInfo.lamports === 0) {
    throw new Error('Cannot send to address with zero SOL balances');
  }
  const destinationSplTokenAccount = (
    await getOwnedTokenAccounts(connection, destinationPublicKey)
  )
    .map(({ publicKey, accountInfo }) => {
      return { publicKey, parsed: parseTokenAccountData(accountInfo.data) };
    })
    .filter(({ parsed }) => parsed.mint.equals(mint))
    .sort((a, b) => {
      return b.parsed.amount - a.parsed.amount;
    })[0];
  if (destinationSplTokenAccount) {
    return await transferBetweenSplTokenAccounts({
      connection,
      owner,
      sourcePublicKey,
      destinationPublicKey: destinationSplTokenAccount.publicKey,
      amount,
      memo,
    });
  }
  return await createAndTransferToAccount({
    connection,
    owner,
    sourcePublicKey,
    destinationPublicKey,
    amount,
    memo,
    mint,
  });
}

function createTransferBetweenSplTokenAccountsInstruction({
  owner,
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memo,
}) {
  let transaction = new Transaction().add(
    transfer({
      source: sourcePublicKey,
      destination: destinationPublicKey,
      owner: owner.publicKey,
      amount,
    }),
  );
  if (memo) {
    transaction.add(memoInstruction(memo));
  }
  return transaction;
}

async function transferBetweenSplTokenAccounts({
  connection,
  owner,
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memo,
}) {
  const transaction = createTransferBetweenSplTokenAccountsInstruction({
    owner,
    sourcePublicKey,
    destinationPublicKey,
    amount,
    memo,
  });
  let signers = [owner];
  return await connection.sendTransaction(transaction, signers, {
    preflightCommitment: 'single',
  });
}

async function createAndTransferToAccount({
  connection,
  owner,
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memo,
  mint,
}) {
  const newAccount = new Account();
  let transaction = new Transaction();
  transaction.add(
    assertOwner({
      account: destinationPublicKey,
      owner: SystemProgram.programId,
    }),
  );
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: owner.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        ACCOUNT_LAYOUT.span,
      ),
      space: ACCOUNT_LAYOUT.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );
  transaction.add(
    initializeAccount({
      account: newAccount.publicKey,
      mint,
      owner: destinationPublicKey,
    }),
  );
  const transferBetweenAccountsTxn = createTransferBetweenSplTokenAccountsInstruction(
    {
      owner,
      sourcePublicKey,
      destinationPublicKey: newAccount.publicKey,
      amount,
      memo,
    },
  );
  transaction.add(transferBetweenAccountsTxn);
  let signers = [owner, newAccount];
  return await connection.sendTransaction(transaction, signers, {
    preflightCommitment: 'single',
  });
}

export async function closeTokenAccount({
  connection,
  owner,
  sourcePublicKey,
}) {
  let transaction = new Transaction().add(
    closeAccount({
      source: sourcePublicKey,
      destination: owner.publicKey,
      owner: owner.publicKey,
    }),
  );
  let signers = [owner];
  return await connection.sendTransaction(transaction, signers, {
    preflightCommitment: 'single',
  });
}
