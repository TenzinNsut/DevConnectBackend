const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
const  User  = require("../models/user");
// Middleware
// app.use(express.json());           // Parse JSON: Must be applied before
// app.use(cookieParser());           // Tp parse the cookies
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// console.log(process.env.JWT_SECRET_KEY )
const userAuth = async (req, res, next) => {
    try {
        // 1.) Read the cookies, get Token
        const { Token } = req.cookies;
        if (!Token) {
            // throw new Error("Token is not valid!");
            return res.status(401).send("Please login!");
        }
        // 2.) Validate the Token -> get the decoded Message -> get User Id
        const decodedObject = jwt.verify(Token, process.env.JWT_SECRET_KEY);
        const { _id } = decodedObject;
        // 3.) Check whether the users exists in DB.
        const userProfile = await User.findById({ _id: _id });
        if (!userProfile) {
            throw new Error("User Does not Exist");
        } 
        req.userProfile = userProfile;
        next();   
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
}

const adminAuth = (req, res, next) => {
    const token = "xyz";
    const isAdminAuthorized = token === "xyz";
    if (!isAdminAuthorized) {
        res.status(401).send("Unauthorized request!");
    } else {
        next();
    }
}

module.exports = { adminAuth, userAuth };