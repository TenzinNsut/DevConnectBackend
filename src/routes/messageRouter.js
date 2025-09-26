const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Message = require("../models/message");
const messageRouter = express.Router();

// Get message history between logged-in user and another user
messageRouter.get("/messages/:otherUserId", userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.userProfile._id;
        const otherUserId = req.params.otherUserId;

        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: loggedInUserId },
            ]
        }).sort({ createdAt: 'asc' });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Error fetching messages" });
    }
});

module.exports = messageRouter;
