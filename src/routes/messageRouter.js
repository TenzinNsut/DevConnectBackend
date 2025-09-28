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

// Get unread message count for current user
messageRouter.get("/unread-count", userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.userProfile._id;
        
        const unreadCount = await Message.countDocuments({
            receiverId: loggedInUserId,
            isRead: false
        });

        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Error fetching unread count" });
    }
});

// Get unread messages grouped by sender
messageRouter.get("/unread-messages", userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.userProfile._id;
        
        const unreadMessages = await Message.aggregate([
            { $match: { receiverId: loggedInUserId, isRead: false } },
            { $group: { _id: "$senderId", count: { $sum: 1 }, latestMessage: { $last: "$$ROOT" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "sender" } },
            { $unwind: "$sender" },
            { $project: { senderId: "$_id", count: 1, latestMessage: 1, sender: { firstName: 1, lastName: 1, photoUrl: 1 } } }
        ]);

        res.status(200).json(unreadMessages);
    } catch (error) {
        console.error("Error fetching unread messages:", error);
        res.status(500).json({ message: "Error fetching unread messages" });
    }
});

// Mark messages as read for a specific conversation
messageRouter.put("/mark-read/:otherUserId", userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.userProfile._id;
        const otherUserId = req.params.otherUserId;

        await Message.updateMany(
            { senderId: otherUserId, receiverId: loggedInUserId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ message: "Error marking messages as read" });
    }
});

module.exports = messageRouter;
