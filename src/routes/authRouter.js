const express = require("express");
const authRouter = express.Router();
const { signUpValidator, userEmailValidator, loginValidator, patchValidator, deleteValidator } = require("../utils/validators");
const { handleValidationErrors } = require("../utils/handleValidationErrors");
const bcrypt = require("bcrypt");
const User = require("../models/user");


// Add user data to Database:
// 👉 Needs full validation (signupValidator).
authRouter.post("/signup", signUpValidator, handleValidationErrors,  async (req, res) => {
    try {
        // 1.) Perform sanitization and validation both at API and Schema level: done
        // 2.) Encrypt the password before saving it to DB.
        const { firstName, lastName, emailId, password, age, gender, photoUrl, about, skills } = req.body;
        const hashPassword = await bcrypt.hash(password, 12); // (plaintext, slatrounds:12);
        // 3.) After Hashing the password now store it to DB.
        const user = new User({firstName, lastName, emailId, password: hashPassword, age, gender, photoUrl, about, skills});
        await user.save({validateBeforeSave:true});
        res.json({message:"User has signed up succesfully" });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(400).json({ message: "Encountered issue while saving the data", error: err.message });
    }
});

authRouter.post("/login", loginValidator, handleValidationErrors, async (req, res) => {
    try {
        const { emailId, password } = req.body;
        // 1.) Check if emailId exits in DB or not
        const userProfile = await User.findOne({ emailId: emailId });
        if (!userProfile) {
            throw new Error("Invalid Credentials");
        }
        // 2.) Now compare provided password with passwordHash stored in DB
        const isValidPassword = await userProfile.verifyPassword(password);
        // 3.) Check if password is vlaid, then display the profile
        if (isValidPassword) {
            // 4.) Create a JWT Token.
            const Token = await userProfile.getJWT();

            // 5.) Add Token to cookie and send the response back to the user. 
            res.cookie("Token", Token, {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // cookie expires after 7 day
                httpOnly: true,
                secure: true,
                sameSite: 'none' // Essential for cross-domain cookies
            });
            // res.json({
            //     message: `${userProfile.firstName} you have logged in successfully!`,
            //     data: userProfile
            //  });
            res.send(userProfile)
        } else {
            throw new Error("Invalid Credentials");
        }
    } catch (err) {
        res.status(400).send("OOPS! " + err.message);
    }
})

authRouter.post("/logout", async (req, res) => {
    res.cookie("Token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ message: "You have loged out"});
})

module.exports = authRouter;