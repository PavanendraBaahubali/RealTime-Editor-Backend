const express = require('express')
const authController = require('../controllers/authControllers');
const verifyToken = require('../security/verifyToken');

const authRoutes = () => {
   const router = express.Router();
    try{
        router.post('/login', (req, res) => authController.verifyLoginUser(req, res))
        router.post('/register', (req, res) => authController.registerUser(req, res))
    }
    catch(err){
        console.log(err.message);
    }

    return router
}

module.exports = authRoutes;