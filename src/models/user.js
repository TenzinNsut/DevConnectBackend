const mongoose = require("mongoose");
const validator = require("validator"); // To validate email
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: "User", // optional (if it references another model)
        // auto: true,
        validate: {
            validator: (value) => mongoose.Types.ObjectId.isValid(value),
            message: "Invalid user ID format",  
        },
     }, // auto-generate if not provided},
    firstName: { type: String, required: true,  min: 3, max: 50, trim: true},
    lastName: { type: String,  min: 4, max: 50, trim: true },
    emailId: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true,
        // Will not work for PATCH(update), only work for PUT(signUp): Use findOneAndUpdate(where,update,options:{run validtors})
        validate: {
            validator: function (email) {
                return validator.isEmail(email);
            },
            message: "Please enter a valid email address"
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        //Will not work for PATCH(update), only work for PUT(signUp): Use findOneAndUpdate(where,update,options:{run validtors})
        validate: {
            validator: (pwd) => {
                return validator.isStrongPassword(pwd, {minLength: 8, minLowercase:1, minUppercase:1, minNumbers: 1, minSymbols: 1})
            },
            message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        }
    },
    age: { type: Number, min: 18, max: 120, trim: true, required: true },
    gender: {
        type: String, 
        trim: true,
        lowercase: true,
        enum: {
            values: ["male", "female", "others"],
            message: "Gender data not is not valid. Please pick from the following option:[male,female,others]"
        },
        //Will not work for PATCH(update), only work for PUT(signUp): Use findOneAndUpdate(where,update,options:{run validtors})
        validate(value) {
            if (!["male", "female", "others"].includes(value)) {
                throw new Error("Gender data not is not valid. Please pick from the following option:[male,female,others]")
            }
        }
    },
    photoUrl: {
        type: String,
        trim: true,
        default: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
        validate(value) {
            if (!validator.isURL(value)) {
                throw new Error("Provided URL is not valid: " + value);
            }
        }
    },
    about: { type: String, default: "This is default about...", min:20, max:200 },
    skills: {
        type: [String], 
        required: true,
        validate: {
            validator: (array) => { return array.length <= 10; },
            message: "You cannot add more than 10 skills"
        },
        // If input is given as "string convert it into array",
        set: (val) => Array.isArray(val) ? val : val.split(",").map(s => s.trim())  // auto-convert CSV → array
    
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {timestamps: true});


// ----Compound Indexing-------
userSchema.index({ firstName: 1, lastName: 1 });


// Helper Functions, can be called directly
userSchema.methods.getJWT = async function () {
    const user = this;
    const Token =  jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
    return Token;
}

userSchema.methods.verifyPassword = async function(inputPasswordByUser){
    const user = this;
    const hashedPassword = user.password;
    
    const isValidPassword = await bcrypt.compare(inputPasswordByUser, hashedPassword);
    return isValidPassword;
}


// const User = ;

module.exports = mongoose.model("User", userSchema);