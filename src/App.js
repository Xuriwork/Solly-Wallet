import { BrowserRouter as Router, Route } from 'react-router-dom';

import './App.scss';

import { WalletProvider } from './utils/wallet';
import { ConnectionProvider } from './utils/connection';

import CreateWalletPage from './pages/CreateWallet';
import RestoreWalletPage from './pages/RestoreWallet';
import StartPage from './pages/StartPage';
import VerifyMnemonicPage from './pages/VerifyMnemonicPage';
import CreatePasswordPage from './pages/CreatePasswordPage';
import WalletCreatedPage from './pages/WalletCreatedPage';

const App = () => {
  return (
    <ConnectionProvider>
      <WalletProvider>
        <Router>
          <div className='app-component'>
              <Route exact path='/' component={StartPage} />
              <Route path='/create-wallet/mnemonic' component={CreateWalletPage} />
              <Route path='/create-wallet/verify' component={VerifyMnemonicPage} />
              <Route path='/create-wallet/create-password' component={CreatePasswordPage} />
              <Route path='/create-wallet/wallet-created' component={WalletCreatedPage} />
              <Route path='/restore-wallet' component={RestoreWalletPage} />
          </div>
        </Router>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
