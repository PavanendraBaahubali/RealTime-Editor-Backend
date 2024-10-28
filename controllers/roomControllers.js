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
        res.status(200).json({roomData, status : 'SUCCESS'});
        return
    }
    catch(err){
        res.status(500).json({message : err.message});
        return
    }
}
const saveRoomContent = async (req, res) => {
    try {
        const { content, version } = req.body;
        const {roomId} = req.params;

        
        const updatedRoom = await Room.findOne({ _id : new mongoose.Types.ObjectId(roomId)});

        if (!updatedRoom) {
            console.log(updatedRoom)
            return res.status(404).json({ message: 'Room not found' });
        }

        console.log('updated', updatedRoom.version, 'version from UI', version);

        if (updatedRoom.version !== version){
            return res.status(409).json({ status: 'CONFLICT', message: 'Content was updated by another user.' });
        }

       // Update content and increment version
       updatedRoom.content = content;
       updatedRoom.version += 1; // Increment version
       await updatedRoom.save();

       res.json({ status: 'SUCCESS', version: updatedRoom.version });
       return 

    } catch (err) {
        console.error('Error updating room content:', err);
        res.status(500).json({ status: 'ERROR', message: 'Failed to save content.' });
        return
    }
};



module.exports = {getRoomDetails, saveRoomContent};