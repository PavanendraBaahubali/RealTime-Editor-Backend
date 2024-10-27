const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./genJwt');

const verifyToken = (req, res, next) => {
    try{
        const authHeader = req.headers['authorization'];
        if (!authHeader){
            res.status(404).json({message : 'No token found in auth headers'})
            return
        }
        const extractToken = authHeader.split(' ')[1]
        console.log(extractToken);

        jwt.verify(extractToken, SECRET_KEY, (err) => {
            if(err){
                res.status(401).json({message : 'Token is invalid'});
                return 
            }
            next();
        })
        

    }
    catch(err) {
        throw new Error(err.message);
    }
}

module.exports = verifyToken;