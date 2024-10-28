const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName : {type : String, require: true},
    creatorName : {type : String, require : true},
    creatorId : {type : String, require : true},
    connectedUsers : {type : Array, require : true},
    content : {type : String, require : true},
    version : {type : Number, default : 0},
    lastModified: { type: Date, default: Date.now() },
    lastModifiedBy: { type: String, default : '' },
})

const Room = mongoose.model('room', roomSchema);
module.exports = Room;
