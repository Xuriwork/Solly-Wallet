import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ordinalSuffixFormatter } from '../utils/utils';
import { validateMissingMnemonicPhrase } from '../utils/validators';

const VerifyMnemonicPage = () => {
    const location = useLocation();
    const history = useHistory();
    const mnemonicPhrase = location.state.mnemonicPhrase;
    const [notValid, setNotValid] = useState(false);
    const [missingIndexes, setMissingIndexes] = useState([]);
    const [firstMissingMnemonic, setFirstMissingMnemonic] = useState('');
    const [secondMissingMnemonic, setSecondMissingMnemonic] = useState('');

	useEffect(() => {
		const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		const randomNumbers = [];
		let numbersLength = numbers.length;
		let j = 0;

		while (numbersLength--) {
			j = Math.floor(Math.random() * (numbersLength + 1));
			randomNumbers.push(numbers[j]);
			numbers.splice(j, 1);
        };
        
        setMissingIndexes([randomNumbers[0], randomNumbers[1]]);
    }, [mnemonicPhrase]);

    const handleChangeFirstMissingMnemonic = (e) => setFirstMissingMnemonic(e.target.value);
    const handleChangeSecondMissingMnemonic = (e) => setSecondMissingMnemonic(e.target.value);

    const handleVerifyMnemonic = (e) => {
        e.preventDefault();
        const { valid } = validateMissingMnemonicPhrase({mnemonicPhrase, missingIndexes, firstMissingMnemonic, secondMissingMnemonic});
        if (!valid) return setNotValid(true);
        history.push('/create-wallet/create-password');
    };
    
	return (
		<div className='verify-mnemonic-page'>
            <h1>Confirm your passphrase</h1>
			<div className='container'>
                <label>{ordinalSuffixFormatter(missingIndexes[0])} word</label>
				<input type='text' value={firstMissingMnemonic} onChange={handleChangeFirstMissingMnemonic} />
                <label>{ordinalSuffixFormatter(missingIndexes[1])} word</label>
                <input type='text' value={secondMissingMnemonic} onChange={handleChangeSecondMissingMnemonic} />
                { notValid && <p className='invalid-words'>Words do not match</p> }
                <button onClick={handleVerifyMnemonic} style={{ marginTop: 10 }} className='main-button'>Continue</button>
			</div>
		</div>
	);
};

export default VerifyMnemonicPage;
