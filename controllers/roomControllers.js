const Room = require("../models/roomSchema");
const mongoose = require('mongoose');

const getRoomDetails = async (req, res) => {
    try{    
        const {roomId} = req.params;

        const roomData = await Room.findOne({_id : new mongoose.Types.ObjectId(roomId)});
        if (!roomData){
            console.log('not found');
            res.status(404).json({message : 'No room was found'})
            return 
        }
        res.status(200).json(roomData);
        return
    }
    catch(err){
        res.status(500).json({message : err.message});
        return
    }
}




module.exports = {getRoomDetails};