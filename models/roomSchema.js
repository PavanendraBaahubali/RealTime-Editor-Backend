const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName : {type : String, require: true},
    creatorName : {type : String, require : true},
    creatorId : {type : String, require : true},
    connectedUsers : {type : Array, require : true},
    content : {type : String, require : true},
})

const Room = mongoose.model('room', roomSchema);
module.exports = Room;
