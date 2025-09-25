const express = require("express");
const requestRouter = express.Router();
const { signUpValidator, userEmailValidator, loginValidator, patchValidator, deleteValidator } = require("../utils/validators");
const { handleValidationErrors } = require("../utils/handleValidationErrors");
// Schema and Model + Schema Level validation
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth")
const ConnectionRequestModel = require("../models/connectionRequest")


requestRouter.post("/request/send/:status/:toUserId",userAuth, async (req, res) => {
    try {

        const fromUserId = req.userProfile._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;


        // ----------------------API Level Validators--------------------------
        // 1.) Validate the params: i.) status[ignored,interested] ii.) sending the request to oneself iii.) verify toUserId  iv.)Check if request is already made 
        // i.) validate status[ignored,interested]
        const allowedStatus = ["ignored", "interested"];
        if (!allowedStatus.includes(status)) {
            return res.status(404).json({message: `${status} is an invalid status type. Allowed Only = ["ignored", "interested"]`})
            // throw new Error(`${status} is an invalid status type. Allowed Only = ["ignored", "interested"]`);
        }
        // ii.) NOTE: Prevent ->T he user is sending the request to itself
        if (fromUserId == toUserId) {
            return res.status(404).json({message: "Cannot make connection request to yourself"})
            // throw new Error("Cannot make connection request to yourself");
       }
        // iii.) Verifying if toUserId exists in the User Collection
        const isValidToUserId = await User.findOne({ _id: toUserId })
        if (!isValidToUserId) {
            return res.status(404).json({message: "User not found!"})
            // throw new Error("Invalid toUserId");
        }
        // iv.) Check if request is already made in ConnectionRequest Collection
        // NOTE: if sender receiver is swapped still no connection requestion should be made
        // const requestFromUserId = await ConnectionRequestModel.findOne({ fromUserId: fromUserId, toUserId: toUserId });
        // const requestFromToUserId = await ConnectionRequestModel.findOne({ fromUserId: toUserId, toUserId: fromUserId });
        const requestAlreadyMade = await ConnectionRequestModel.findOne({
            $or: [
                { fromUserId: fromUserId, toUserId: toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ]
        });
        if (requestAlreadyMade) {
            return res.status(404).json({message: "Connection Request has already been sent"})
            // throw new Error("Connection Request has already been sent");
        }
    
        // 2.) Save the connection Request, by creating new Instance
        const connectionRequest = new ConnectionRequestModel({ fromUserId: fromUserId, toUserId: toUserId, status: status });
        const data = await connectionRequest.save({ validateBeforeSave: true });
        res.json({
            message: `${req.userProfile.firstName} has sent request type:${status} to ${isValidToUserId.firstName}`,
            data,
        });
    } catch (err) {
      res.status(400).send("Error: " + err.message);
    }
  }
);

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {
        // Note: make sure the "toUserId" is the person who has logged in,
        // Only "toUserId", should be able to accept/reject the request
        // Also, connection should be in "interested" state before "accepting/rejecting" request
        // And so if connection is in "ignore" sate "accepting/rejecting" should not be allowed
        const loggedInUser = req.userProfile;
        const { status, requestId } = req.params;


        // 1.) Validate the status: status["accepted","rejected"];
        const allowedStatus = ["accepted", "rejected"]
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({message: `${status} is invalid status type. Allowed only = ["accepted", "rejected"]`})
        }

        // 2.) Check if requestId is valid 
        const isValidRequest = await ConnectionRequestModel.findOne({
            // _id: requestId, // i.) Should exist in DB
            fromUserId: requestId, // Removed this line as it was incorrect
            toUserId: loggedInUser._id, // ii.) toUserID == loggedInUser._id; Only "toUserId", should be able to accept/reject the request
            status: "interested", // iii.) status should be in "interested" state before "accepting/rejecting" request
            // Hardcoded "interested", so once changed, you would not be able to switch{accpeted,rejected}
        })
        if (!isValidRequest) {
            return res.status(404).json({message: "Connection Request not found"})
        }

        // 4.) Upate the request status as per the "params"
        isValidRequest.status = status;

        // 5.) Update and save the request status
        const savedData = await isValidRequest.save();

        res.json({
            message: "Connection request status is " + status,
            data: savedData,
        })
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});

requestRouter.get("/user", userAuth, userEmailValidator, handleValidationErrors, async (req, res) => {
    try {
        const userEmail = req.body.emailId;
        // 1.) check  wheather user exists in DB
        const isValidUser = await User.findOne({ emailId: userEmail });
        if (isValidUser) {
            res.json({
                message: "Valid user; Here is your Info",
                data: isValidUser,
            })
            // res.send(isValidUser);
        } else {
            throw new Erorr("User Does not exist");
        }
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});

module.exports = requestRouter;