const express = require('express');
const roomController = require('../controllers/roomControllers')

const roomRoutes = () => {
    const router = express.Router();
    try{

        router.get('/:roomId', (req, res) => {
            roomController.getRoomDetails(req, res)});

    }
    catch(err){
        console.log(err.message);
    }
    return router
}



module.exports = roomRoutes;