const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// require('dotenv').config();

const SECRET_KEY = 'dfrt-78iu-walter-90uojesee'
const genJwt = (userId) => {
    return jwt.sign({id : userId}, SECRET_KEY, {expiresIn : '1h'})
}

module.exports = {genJwt, SECRET_KEY};