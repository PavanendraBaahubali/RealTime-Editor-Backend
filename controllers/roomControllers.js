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
        const { content, userId } = req.body;
        const { roomId } = req.params;

        const updatedRoom = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId) });
        if (!updatedRoom) {
            console.log(updatedRoom);
            return res.status(404).json({ message: 'Room not found' });
        }

        updatedRoom.content = content;
        await updatedRoom.save();

        res.json({ status: 'SUCCESS', userId });
        return 
    } catch (error) {
        console.error("Error saving room content:", error);
        res.status(500).json({ message: 'Internal server error', error });
        return 
    }
};




const saveCanvasData = async (req, res) => {
    const {roomId, canvasData} = req.body;
    try{
        const roomData = await Room.findOne({_id :  new mongoose.Types.ObjectId(roomId)});

        roomData.canvasData = new Binary(canvasData)
        await roomData.save();
        res.status(200).json({message : 'updated canvas', roomData});
        return 
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({message : err})
        return 
    }

}



module.exports = {getRoomDetails, saveRoomContent, saveCanvasData};