const express = require("express");
const userRouter = express.Router();
const { signUpValidator, userEmailValidator, loginValidator, patchValidator, deleteValidator } = require("../utils/validators");
const { handleValidationErrors } = require("../utils/handleValidationErrors");
// Schema and Model + Schema Level validation
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequestModel = require("../models/connectionRequest");
const user = require("../models/user");



// Get all the pending connnection requests for the loggedInUsers
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        /*
        -Check is user is logged in,
        -if in db "toUserId == loggedInUser" -> get object Id
        -From object Id get -> "fromUserId"
        -send the data (fromUserID) to user
        */
        const loggedInUser = req.userProfile;

        // 1.) Check if loggedIn User exits in ConnectionRequests Collection 
        // and return only, where status  = "interested"
        const connectionRequests = await ConnectionRequestModel.find({
            $and: [{toUserId: loggedInUser._id, status: "interested"}]
        }).populate("fromUserId", ["firstName", "lastName", "gender", "photoUrl", "about", "skills"])

        // Prevent from sending extra info
        const safeData = connectionRequests.map((row) => row.fromUserId);

        
        res.json({
            message: "Here is your connection Requests",
            data: safeData,
        })
        
        
    } catch (err) {
       res.status(400).send("Error: " + err.message)
    }
    
});

// View the connections (once accepted)
userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.userProfile;  
        // Check in ConnectionRequests collection, where LoggedInUser == FromUser & Status == accepted
        // From those documents, fetch the To userId, and display on the screen
        // Note: both from and to user should be able to see the connections once status = "accepted"
        const acceptedRequests = await ConnectionRequestModel.find({
            $or: [
                { fromUserId: loggedInUser._id,  status: "accepted" },
                { toUserId: loggedInUser._id, status: "accepted" }
            ],
        }).populate("fromUserId", ["firstName", "lastName", "gender", "photoUrl", "about", "skills"])
          .populate("toUserId", ["firstName", "lastName", "gender", "photoUrl", "about", "skills"])

        
        
        // Prevent DB from sending nothing extra only the user Details
        const safeData = acceptedRequests.map((row) => {
            // NOTE: LoggedIn user should only see the docs where {toUserId,accepted} but not itself i.e {fromUserId}
            // Note: _id data type is different so best thing is to convert both of them to strings
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return row.toUserId;
            }
            return row.fromUserId;
        });



        res.json({
            message: "Here is the list of your connetions",
            data: safeData,
        })


        
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});


userRouter.get("/user/feed", userAuth, async (req, res) => {
    try {
        /*
        ->LoggedInUser should not see the users, who he already has ["Ignored","Rejected","Accepted","Interested"]
        LoggedInUser should only see fresh users.
        ->LoggedInUser should not see himself in the feed.
        */
        
        const loggedInUser = req.userProfile;
        // Query: By default data is in string
        const page = parseInt(req.query.page) || 1; 
        const receivedLimit = parseInt(req.query.limit) || 10;

        // Sanitize the limit max limit = 20;
        let limit = 0
        if (receivedLimit > 20) {
            limit = 20;
        } else {
            limit = receivedLimit;
        }


        
        const skipFormula = (page - 1) * limit;


        // Get all connection requests (sent + received):
        // FormUserId-[interested,ignored]->toUserId or vice-verse, should not be shown in feed.
        const usersNotAllowedInFeed = await ConnectionRequestModel.find({
            $or: [
                { toUserId: loggedInUser._id },
                { fromUserId: loggedInUser._id },
            ],
        })
            .select("toUserId fromUserId") // There are the people who should not be show in the feed of loggedInUser
        
        // Using set() data Structure to segregate the "usersNotAllowedInFeed":
        // set[A,B,D,K] <- B (not allowed) : set does not allowed repeated value, only stores it once. (unique values)
        const hideUsersFromFeed = new Set();
        usersNotAllowedInFeed.forEach((req) => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });
        const allowedUsersInfeed = await User.find({
          $and: [
            { _id: { $nin: Array.from(hideUsersFromFeed) } }, //$nin -> not in array
            { _id: { $ne: loggedInUser._id } }, // $ne -> not equal to
          ],
        })
          .select([
            "firstName",
            "lastName",
            "age",
            "gender",
            "photoUrl",
            "about",
            "skills",
          ])
          .skip(skipFormula) //Pagination: allow only 10users/chunk in feed out of all the docs in DB
          .limit(limit);



        res.json({
            message: "Here is your Feed",
            data: allowedUsersInfeed,
        });
      
    } catch (err) {
        res.status(400).send("Error! " + err.message);
    }
});



module.exports = userRouter;