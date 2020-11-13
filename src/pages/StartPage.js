import { useHistory } from "react-router-dom";

const StartPage = () => {
    const history = useHistory();

    const handleCreateWallet = () => history.push('/create-wallet/mnemonic');
    const handleRestoreWallet = () => history.push('/restore-wallet');

    return (
        <div className='start-page'>
            <div className='container'>
                <h1>Solly Wallet</h1>
                <p>Welcome to the SOL Ecosystem</p>
                <div className='button-container'>
                    <button className='main-button' onClick={handleCreateWallet}>Create Wallet</button>
                    <button className='secondary-button' onClick={handleRestoreWallet}>Restore Wallet</button>
                </div>
            </div>
        </div>
    )
}

export default StartPage;
