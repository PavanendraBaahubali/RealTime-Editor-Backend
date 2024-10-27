const express = require('express');
const app = express();
const {createServer} = require('http');
const socketIo = require('socket.io');

const cors = require('cors');
const getDbConnection = require('./mongoDB');
const authRoutes = require('./routes/authRoutes');
const Room = require('./models/roomSchema');
const User = require('./models/userSchema');

const mongoose = require('mongoose');
const roomRoutes = require('./routes/roomRoutes');

const server = createServer(app);
const io = socketIo(server, {
    cors : {
        origin : 'http://localhost:3000'
    }
})

app.use(cors());

app.use(express.json());


const startServer = async () => {
    try{
        const db = await getDbConnection();

        app.use('', authRoutes());
        app.use('/room/', roomRoutes());

        // socket events
        io.on('connection', (socket) => {
            console.log('socket connected');

            socket.on('content-update', async ({ roomId, content }) => {
                try {
                    // const roomData = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId) });
            
                    // if (!roomData) {
                    //     console.log('Room not found:', roomId);
                    //     return;
                    // }
            
                    // roomData.content = content;
                    // await roomData.save();
            
                    // const updatedContent = roomData.content;

                    console.log('im in event content-update')
                    io.to(roomId).emit('updated-content', content);
                    
                } catch (err) {
                    console.log('Error updating content:', err);
                }
            });
            



            socket.on('join-room', async ({ userId, roomId, userName }) => {
                if (!mongoose.Types.ObjectId.isValid(roomId)) {
                    socket.emit('error', 'Invalid room Id'); 
                    return;
                }

                const roomData = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId) });
            
                if (!roomData) {
                    socket.emit('error', 'Room was not found'); 
                    console.log('room is not found');
                    return;
                }
                
                socket.join(roomId);
                
                const isUserExist = roomData.connectedUsers.some((user) => user.userId === userId)

                if (!isUserExist) {
                    roomData.connectedUsers.push({ userId, userName });
                    await roomData.save();
                }
                
            
                console.log('Emitting user-joined event');
                io.to(roomId).emit('user-joined', roomData);
            });


            socket.on('create-room', async ({userId, roomName, userName}) => {
                const newRoom = new Room({
                    roomName,
                    creatorName : userName,
                    creatorId : userId,
                    connectedUsers : [],
                    content : '',
                })


                await newRoom.save();
                const newRoomStringId = newRoom._id.toString();
                socket.join(newRoomStringId);

                const user = await User.findOne({_id : new mongoose.Types.ObjectId(userId)})

                user.createdRooms.push(newRoom);

                userId = user._id

                await user.save();

                newRoom.connectedUsers.push({userId, userName})

                await newRoom.save();

                io.to(newRoomStringId).emit('room-created', newRoomStringId);


            })
        })


        server.listen(4000, () => console.log('server is running on 4000'));
    }
    catch(err){
        console.log(err.message);
    }
}

startServer();
