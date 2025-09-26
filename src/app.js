const express = require("express");
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors")

require("dotenv").config({ path: __dirname + "/../.env" });


// const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean"); 


// Routers
const authRouter = require("./routes/authRouter");
const requestRouter = require("./routes/requestRouter");
const profileRouter  = require("./routes/profileRouter");
const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");


app.set('trust proxy', 1); // Trust the first proxy

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});


app.use(express.json());           // Parse JSON: Must be applied before
app.use(cookieParser());           // Tp parse the cookies
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


// app.use(helmet());                 // Secure headers
// app.use(mongoSanitize());          // Prevent NoSQL injection
// app.use(xss());                    // Prevent XSS


const Message = require('./models/message');

const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} is online.`);
    }

    socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
        try {
            const newMessage = new Message({ senderId, receiverId, message });
            await newMessage.save();

            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                // Send the message to the specific receiver
                io.to(receiverSocketId).emit('receiveMessage', newMessage);
            }
            // Also send the message back to the sender for their UI
            socket.emit('receiveMessage', newMessage);

        } catch (error) {
            console.error('Error handling sendMessage:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [key, value] of Object.entries(userSocketMap)) {
            if (value === socket.id) {
                delete userSocketMap[key];
                console.log(`User ${key} is offline.`);
                break;
            }
        }
    });
});


// Add user data to Database:
// 👉 Needs full validation (signupValidator).

app.use("/", authRouter);
app.use("/", userRouter)
app.use("/", profileRouter);
app.use("/", requestRouter);



const port = process.env.PORT || 5000

connectDB().then(() => {
    console.log("DB connection established successfully");
    server.listen(port, () => {
        console.log(`Server is listening to requests at http://localhost:${port}/`);
    })
}).catch((err) => {
    console.error("DB connection failed! " + err);
})
