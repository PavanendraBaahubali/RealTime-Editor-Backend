const User = require("../models/userSchema");
const comparePassword = require("../security/comparePassword");
const {genJwt} = require("../security/genJwt");

const registerUser = async (req, res) => {
    const {userName, emailId, password} = req.body;
    console.log('register',userName, emailId, password);
    try{
        const existingUser = await User.findOne({emailId});
        if (existingUser){
            res.status(400).json({message : 'user already existed'});
            return 
        }

        const newUser = new User ({
            userName,
            emailId,
            password,
            createdRooms : [],
            joinedRooms : [],
        })

        await newUser.save()
        const token = genJwt(newUser._id);
        return res.status(200).json({token, userId : newUser._id, userName : newUser.userName})
    }
    catch(err){
        return res.status(500).json({message : err.message});
    }

}


const verifyLoginUser = async(req, res) => {
    const {emailId, password} = req.body;
    console.log('userlogin',emailId, password);
    try{
        const userDetails = await User.findOne({emailId})
        if (!userDetails) {
            res.status(401).json({message : 'Email is not found'})
            return 
        }
        const isMatch = comparePassword(password, userDetails.password);
        if (isMatch){
            const token = genJwt(userDetails._id);
            res.status(200).json({token, userName : userDetails.userName, userId : userDetails._id})
            return 
        }
        else{
            return res.status(201).json({message : 'Invalid credentials'})
        }
    }
    catch(err){
        res.status(500).json({message : err.message});
        return
    }
}

module.exports = {registerUser, verifyLoginUser};