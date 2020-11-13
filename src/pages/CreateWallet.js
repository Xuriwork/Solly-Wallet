import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
	generateMnemonicAndSeed,
	hasLockedMnemonicAndSeed,
	loadMnemonicAndSeed,
	mnemonicToSeed,
	storeMnemonicAndSeed,
} from '../utils/wallet-seed';

const CreateWalletPage = () => {
	const history = useHistory();
	const [checked, setChecked] = useState(false);
	const [mnemonicPhrase, setMnemonicPhrase] = useState([]);
	const [seed, setSeed] = useState(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (copied) setTimeout(() => setCopied(false), 1000);
	}, [copied]);

	useEffect(() => {
		generateMnemonicAndSeed().then((result) => {
			setMnemonicPhrase(result.mnemonic.split(' '));
			setSeed(result.seed);
		});
	}, []);

	const handleCheck = () => setChecked(!checked);
	const handleGoToVerifyWallet = () => {
		if (!checked) return;
		history.push('/create-wallet/verify', { mnemonicPhrase });
	};

	const handleCopyMnemonicPhrase = () => {
		if (!navigator.clipboard) return;
		navigator.clipboard.writeText(mnemonicPhrase.join(' ')).then(
			() => setCopied(true),
			(error) => console.error('Async: Could not copy text: ', error)
		);
	};

	return (
		<div className='create-wallet-page'>
			<h1>Save your passphrase</h1>
			<div className='container'>
				<p>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 24 24'
						width='24'
						height='24'
					>
						<path fill='none' d='M0 0h24v24H0z' />
						<path
							fill='#ff5959'
							d='M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z'
						/>
					</svg>
					Please carefully write down these 12 words and store them in a safe
					place. This key is the only way to access your funds, do not share
					this key with anyone.
				</p>
				<div className='mnemonic-phrase-container'>
					{mnemonicPhrase &&
						mnemonicPhrase.map((word, index) => (
							<div key={index + 1} className='mnemonic-word'>
								<span>{index + 1}</span> {word}
							</div>
						))}
					<div
						className='copy-mnemonic-phrase'
						onClick={handleCopyMnemonicPhrase}
					>
						{copied ? (
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 24 24'
								width='24'
								height='24'
							>
								<path fill='none' d='M0 0h24v24H0z' />
								<path
									d='M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z'
									fill='rgba(23,185,120,1)'
								/>
							</svg>
						) : (
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 24 24'
								width='24'
								height='24'
							>
								<path fill='none' d='M0 0h24v24H0z' />
								<path
									d='M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 0 1 3 21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM9 6h8v10h2V4H9v2z'
									fill='rgba(255,255,255,1)'
								/>
							</svg>
						)}
					</div>
				</div>
				<div className='checkbox-container'>
					<input type='checkbox' value={checked} onChange={handleCheck} />
					<label>
						I confirm I have written down and safely stored my secret phrase.
					</label>
				</div>
				<button className='main-button' onClick={handleGoToVerifyWallet}>
					Create Wallet
				</button>
			</div>
		</div>
	);
};

export default CreateWalletPage;
