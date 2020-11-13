export const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
};	

export const validateMissingMnemonicPhrase = ({mnemonicPhrase, missingIndexes, firstMissingMnemonic, secondMissingMnemonic}) => {
    const errors = {};

    if (mnemonicPhrase[missingIndexes[0] - 1] !== firstMissingMnemonic) {
        errors.firstMnemonic = 'Invalid word';
    } else if (mnemonicPhrase[missingIndexes[1] - 1] !== secondMissingMnemonic) {
        errors.secondMnemonic = 'Invalid word';
    };

    const valid = Object.keys(errors).length === 0 ? true : false;
    return { errors, valid };
};