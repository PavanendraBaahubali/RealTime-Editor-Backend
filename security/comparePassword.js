const bcrypt = require('bcryptjs');

const comparePassword = (enteredPassword, actualPassword) =>{
    return bcrypt.compare(enteredPassword, actualPassword);
}

module.exports = comparePassword;