const express = require("express");
const profileRouter = express.Router();
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth")
const {userEmailValidator, patchValidator, deleteValidator, patchPasswordValidator, allowedToUpdate } = require("../utils/validators");
const { handleValidationErrors } = require("../utils/handleValidationErrors");
const bcrypt = require("bcrypt");
const user = require("../models/user");
const sendEmail = require("../utils/mailer");
const crypto = require("crypto");
const ConnectionRequestModel = require("../models/connectionRequest")





profileRouter.get("/profile/view", userAuth, async (req, res) => {
    try {
        const userProfile = req.userProfile;
        // res.json({
        //     message: "Here is your Profile",
        //     data: userProfile
        // })
        res.send(userProfile);
        // res.send(userProfile);
    } catch (err) {
        res.status(400).send("OOPS! " + err);
    }
});

profileRouter.patch("/profile/edit/:userId", userAuth, patchValidator, handleValidationErrors, async (req, res) => {
    try {

        const loggedInUser = req.userProfile;
        const updateRequest = req.body;
        const { _id } = loggedInUser;

    
        // const userId = req.params?.userId; // ? makes userId optional
        // Prevent user from Updating email and password
        delete updateRequest.emailId;
        delete updateRequest.password;

        // const userEmail = req.body.emailId;
        // const allowedToUpdate = ["firstName", "lastName", "age", "photoUrl", "about", "skills"];
        // const finalUpdate = Object.keys(updateRequest).every((key) => allowedToUpdate.includes(key));
    
        // delete updateRequest.emailId; // (Optional)
        // delete updateRequest._id;

    
        // param(userId).custom((value) => isValidObjectId(value)).withMessage("Invalid user ID format");
    
        // if (finalUpdate === false) {
        //     throw new Error("Update not allowed");
        // }   
        // const updatedUserData =  await User.findByIdAndUpdate(userId, updateRequest, {returnDocument: "after"});
        // NOTE: always run validators
        const updatedUserData = await User.findByIdAndUpdate({ _id: _id }, updateRequest, {returnDocument: "after", runValidators: true} )
        // const updatedUserData = await User.findOneAndUpdate({ emailId: userEmail }, updateRequest, {returnDocument: "after", runValidators: true})
        res.json({message:`User data has been succesfully updated: ${updatedUserData}` })
        // res.send(`User data has been succesfully updated: ${updatedUserData}`);
    } catch (err) {
        res.status(400).send("UPDATE FAILED: " + err.message);
    }
});

profileRouter.patch("/profile/edit", userAuth, patchValidator, handleValidationErrors, async (req, res) => {
    try {
        // -> Check whether the fields in the request are allowed or not
        if (!allowedToUpdate(req)) {
            return res.status(404).json({
              message: "Invalid field in update request! Please ensure your update request does not inclue: [emailId, password, _id]"
          })           
        }
        // 1.) Get the Id of current Logged In user
        const loggedInUser = req.userProfile;
        // console.log(loggedInUser);
        // 2.) Now traverse over "req.body" -> fields
        const requestedData = req.body;
        // 3.) Prevent user from updating these fields (Optional: as we already have: "allowedToUpdate" method)
        delete requestedData.emailId;
        delete requestedData.password;
        delete requestedData._id;

        // 4.) Traverse req.body and the the fields -> copy those updated fields in "loggedInUser"
        Object.keys(requestedData).forEach((key) => (loggedInUser[key] = requestedData[key]));
  
        // 5.) Save the upadated data of "loggedInUser,  Note:  use 'await'
        await loggedInUser.save({ validateBeforeSave: true });

        res.json({
            message: `${loggedInUser.firstName} your profile has been updated`,
            data: loggedInUser
        })        
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});

// profileRouter.patch("/profile/edit/password", userAuth, patchPasswordValidator, handleValidationErrors, async (req, res) => {
//     try {
//         // // // 1.) Get logged In user data.
//         // const loggedInUser = req.userProfile;
//         // 1.) Check if user exists in DB
//         const { emailId, password, newPassword } = req.body;
//         const verifiedUser = await User.findOne({ emailId: emailId });
//         if (!verifiedUser) {
//             throw new Error("Invalid Credentials");
//         }
//         // 2.) Compare the password hash
//         const isValidPassowrd = await verifiedUser.verifyPassword(password);
//         // 3.) Update the password -> save in hash
//         if (isValidPassowrd) {
//             const newHashedPassword = await bcrypt.hash(newPassword, 12);
//             const updatePassword = await User.findOneAndUpdate({ emailId: emailId }, { password: newHashedPassword }, { returnDocument: "after", runValidators: true })
//             res.send("Updated the password Successfully, Old: " + password + " New: " + newPassword + " and Hash: " + newHashedPassword);
//         } else {
//             throw new Error("Invalid Credentials");
//         }
//     } catch (err) {
//         res.status(400).send("Error" + err.message);
//     }
// });

profileRouter.post("/forgot-password",userEmailValidator,handleValidationErrors, async (req, res) => {
    try {
      // 1.) Get user email and verify it it exists in DB
      const user = await User.findOne({ emailId: req.body.emailId });
        if (!user) {
            return res.status(404).json({
              message: "No account found with this email address"
          })
      }

      // 2.) Generate a temporary random reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Token expires in 10 minutes
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      // 3.) send token to user's email
    //   const resetURL = `${req.protocol}://${req.get(
    //     "host"
        //   )}/reset-password/${resetToken}`;
       
        // 3.) send token to user's email
        const resetURL = `${process.env.FRONTEND_URL}/reset-password`


      await sendEmail({
        email: user.emailId,
        subject: "Password Reset Token (valid for 10 minutes)",
        message: `To reset your password, paste the Reset Token in the required field and enter your new password. 
        Here is you One Time Reset Token: ${resetToken}`,
      });

      res.status(200).json({
        status: "success",
        message: "Password reset token sent to email",
      });
        
    } catch (err) {
        console.error("Forgot password error: " + err);
        res.status(400).json({
            message: "Error sending reset email. Please try again later."
        });
    }
  }
);

// profileRouter.patch("/reset-password/:token", async (req, res) => {
//     try {
//         // 1.) Get user based on their token
//         const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
//         const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });

//         if (!user) {
//             return res.status(404).json({
//                 messsage: "Invalid Token!"
//             })
//         }

//         // 2.) Set new Password
//         user.password = await bcrypt.hash(req.body.newPassword, 12);
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpires = undefined;
//         await user.save();

//         res.json({
//             status: "success",
//             message: "Password has been reset succesfully"
//         })
        
//     } catch (err) {
//         res.status(400).send("Error: " + err.message);
//     }
//  });

profileRouter.patch("/reset-password", async (req, res) => {
    try {
        const resetToken = req.body.resetToken;

        // 1.) Get user based on their token
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });

        if (!user) {
            return res.status(404).json({
                messsage: "Invalid Token!"
            })
        }

        // 2.) Set new Password
        user.password = await bcrypt.hash(req.body.newPassword, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            status: "success",
            message: "Password has been reset succesfully"
        })
        
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
 });


profileRouter.delete("/delete", userAuth, deleteValidator, handleValidationErrors, async (req, res) => {
    const loggedInUser = req.userProfile; // Get the logged-in user from auth middleware
    const userEmail = req.body.emailId;

    try {
        // 1. Verify the email matches the logged-in user's email
        if (loggedInUser.emailId !== userEmail) {
            return res.status(403).json({ message: "Unauthorized: Email does not match logged-in user." });
        }

        // 2. Delete the user from the User collection
        const deletedUser = await User.findByIdAndDelete(loggedInUser._id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found for deletion." });
        }

        // 3. Delete all related connection requests
        await ConnectionRequestModel.deleteMany({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        });

        res.json({ message: "User and all related connection requests have been deleted successfully!" });

    } catch (err) {
        console.error("Error during user deletion:", err);
        res.status(500).send("Error deleting user: " + err.message);
    }
});





module.exports = profileRouter;

