import { useState } from "react";
import { useHistory } from "react-router-dom";

const CreatePasswordPage = () => {
    const history = useHistory();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const handleChangePassword = (e) => setPassword(e.target.value);
    const handleChangeConfirmPassword = (e) => setConfirmPassword(e.target.value);
    const handleContinue = () => {
        if (password !== confirmPassword) {
            return alert('Passwords do not match');
        };
        history.push('/create-wallet/wallet-created');
    };

    return (
        <div className='create-password-page'>
            <h1>Create Password</h1>
			<div className='container'>
                <label>Password</label>
                <input type='password' value={password} onChange={handleChangePassword} />
                <label>Confirm Password</label>
                <input type='password' value={confirmPassword} onChange={handleChangeConfirmPassword} />
                <button onClick={handleContinue} style={{ marginTop: 10 }} className='main-button'>Continue</button>
            </div>
        </div>
    )
}

export default CreatePasswordPage;