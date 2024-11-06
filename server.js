const express = require("express");
const app = express();
const { createServer } = require("http");
const socketIo = require("socket.io");

const cors = require("cors");
const getDbConnection = require("./mongoDB");
const authRoutes = require("./routes/authRoutes");
const Room = require("./models/roomSchema");
const User = require("./models/userSchema");
require("dotenv").config();

const mongoose = require("mongoose");
const roomRoutes = require("./routes/roomRoutes");

const server = createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://collab-66df3.web.app"], // Multiple origins
    methods: ["GET", "POST"], // Optional, specify allowed methods
  },
});

app.use(cors());

app.use(express.json());

const rowLocks = {};
const userLocks = {};
const curTypingUsers = [];

const startServer = async () => {
  try {
    const db = await getDbConnection();

    app.use("", authRoutes());
    app.use("/room/", roomRoutes());

    // socket events
    io.on("connection", (socket) => {
      console.log("socket connected");

      //
      socket.on("getCreatedRooms", async ({ userId, limit, skip }) => {
        try {
          const userData = await User.findOne(
            {
              _id: new mongoose.Types.ObjectId(userId),
            },
            { createdRooms: { $slice: [skip, limit] } }
            // {$sort : -1}
          );
          const createdRooms = userData?.createdRooms || [];
          socket.emit("createdRooms", { createdRooms });
        } catch (err) {
          console.log(err);
          socket.on(
            "error",
            "something went wrong while getting created Rooms"
          );
        }
      });

      socket.on("getUsers", async ({ roomId }) => {
        try {
          const roomData = await Room.findOne({
            _id: new mongoose.Types.ObjectId(roomId),
          });
          io.to(roomId).emit("allTypeUsers", { roomData });
        } catch (er) {
          console.log(er);
          socket.emit("error", "Something went wrong when fetching getUsers");
        }
      });

      socket.on("read-only", async ({ userId, roomId }) => {
        try {
          console.log("at server read-only listern");
          const roomData = await Room.findOne({
            _id: new mongoose.Types.ObjectId(roomId),
          });
          if (!roomData) {
            console.log("room not found");
            return;
          }
          const user = roomData.connectedUsers.find(
            (user) => user.userId.toString() === userId
          );
          console.log("user", user);

          if (user) {
            console.log("found user", user.userName);
            user.readOnly = true;
            user.readAndWrite = false;
            await roomData.save();

            io.to(roomId).emit("read-only-applied", { roomData });
          } else {
            throw new Error("user not existed");
          }
        } catch (err) {
          console.error("Error setting user to read-only:", err);
          socket.emit(
            "error",
            "An error occurred while setting user to read-only"
          );
        }
      });

      socket.on("stop-typing", ({ userId, roomId }) => {
        const removeIndex = curTypingUsers.findIndex(
          (user) => user.userId === userId
        );

        if (removeIndex !== -1) {
          curTypingUsers.splice(removeIndex, 1);
        }

        console.log("cur", curTypingUsers);
        io.to(roomId).emit("user-stopped-typing", curTypingUsers);
      });

      socket.on("who-is-typing", ({ userId, roomId, userName, caretIndex }) => {
        const userIndex = curTypingUsers.findIndex(
          (user) => user.userId === userId
        );

        if (userIndex !== -1) {
          curTypingUsers[userIndex] = { userId, roomId, userName, caretIndex };
        } else {
          curTypingUsers.push({ userId, roomId, userName, caretIndex });
        }

        io.to(roomId).emit("typing-found", { curTypingUsers });
      });

      socket.on("unlock-row", ({ rowNum }) => {
        socket.emit("lock-released", rowLocks);
      });

      socket.on("lock-row", ({ userId, rowNum, roomId }) => {
        if (userId in userLocks) {
          delete rowLocks[userLocks[userId]];
        }
        if (!rowLocks[rowNum]) {
          rowLocks[rowNum] = userId;
          userLocks[userId] = rowNum;
        }
        if (rowLocks[rowNum] !== userId) {
          socket.emit("error", "Conflict Detected");
          return;
        }

        socket.broadcast.to(roomId).emit("lock-activated", rowLocks);
      });

      socket.on("get-document", async (roomId) => {
        try {
          const roomData = await Room.findOne({
            _id: new mongoose.Types.ObjectId(roomId),
          });
          // console.log(roomData.content);
          socket.emit("load-document", roomData.content);
        } catch (err) {
          console.log(err);
        }
      });

      socket.on("send-changes", ({ delta, roomId }) => {
        console.log("changes received");
        socket.broadcast.to(roomId).emit("receive-changes", delta);
      });

      socket.on("save-document", async ({ data, roomId }) => {
        await Room.findByIdAndUpdate(
          { _id: new mongoose.Types.ObjectId(roomId) },
          { content: data }
        );
        socket.emit("data-saved");
        console.log("document saved.");
      });
      // ------------------------------
      socket.on("join-room", async ({ userId, roomId, userName }) => {
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          socket.emit("error", "Invalid room Id");
          return;
        }

        const roomData = await Room.findOne({
          _id: new mongoose.Types.ObjectId(roomId),
        });

        if (!roomData) {
          socket.emit("error", "Room was not found");
          console.log("Room not found");
          return;
        }

        socket.join(roomId);

        // Ensure the user is not already in the list of connected users
        const isUserExist = roomData.connectedUsers.some(
          (user) => user.userId.toString() === userId
        );

        if (!isUserExist) {
          roomData.connectedUsers.push({
            userId,
            userName,
            readAndWrite: true,
            readOnly: false,
          });
          await roomData.save();
        }

        // Filter out any duplicate users before emitting the event
        const uniqueConnectedUsers = roomData.connectedUsers.filter(
          (user, index, self) =>
            index ===
            self.findIndex(
              (u) => u.userId.toString() === user.userId.toString()
            )
        );

        // Emit the updated list of unique users to all clients in the room
        io.to(roomId).emit("user-joined", {
          ...roomData.toObject(),
          connectedUsers: uniqueConnectedUsers,
        });
      });

      socket.on("create-room", async ({ userId, roomName, userName }) => {
        const newRoom = new Room({
          roomName,
          creatorName: userName,
          creatorId: userId,
          connectedUsers: [],
          version: 0,
          lastModified: Date.now(),
          lastModifiedBy: "",
          rowLocks: [],
        });

        await newRoom.save();
        const newRoomStringId = newRoom._id.toString();
        socket.join(newRoomStringId);

        const user = await User.findOne({
          _id: new mongoose.Types.ObjectId(userId),
        });

        user.createdRooms.push(newRoom);

        userId = user._id;

        await user.save();

        newRoom.connectedUsers.push({
          userId,
          userName,
        });

        await newRoom.save();

        io.to(newRoomStringId).emit("room-created", newRoomStringId);
      });
    });

    server.listen(process.env.PORT, () =>
      console.log(`server is running on ${process.env.PORT}`)
    );
  } catch (err) {
    console.log(err.message);
  }
};

startServer();
