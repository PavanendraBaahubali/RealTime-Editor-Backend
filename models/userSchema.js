const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userName : {type : String, required : true},
    emailId : {type : String, required : true},
    password : {type : String, require : true},
    createdRooms : {type : Array, require : true},
    joinedRooms : {type: Array, require : true},
})

const hashPassword = () => {
    userSchema.pre('save', async function(next) {
        const user = this;
        try{
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            next();
        }
        catch(err){
            next(err);
        }
    })
}
hashPassword();

const User = mongoose.model('user', userSchema);
module.exports = User;