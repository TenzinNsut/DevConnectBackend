const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User" // 
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is of incorrect status type`
        }
    }
}, { timestamps: true });

// -------------------Schema level Validators---------------------
// Runs this function before "save" instance is called
connectionRequestSchema.pre("save", function (next) {
    const connectionRequest = this;
    // Prevent: the user is sending the request to itself
    // Since the type is: "mongoose.Schema.Types.ObjectId"
    if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        throw new Error("Cannot make connection request to yourself!!!")
    }
    // NOTE always call next(), it is a middle ware
    next();
});

// -----------Indexing-----------
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }); // Compound Indexing




const ConnectionRequestModel = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequestModel;