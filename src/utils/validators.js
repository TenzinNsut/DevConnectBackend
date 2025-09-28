const { body, param } = require("express-validator");
const mongoose = require("mongoose");   // also missing in your code

// --- Custom functions (must come first) ---
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const isValidSkill = (value) => {
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim());
  }
  if (Array.isArray(value)) {
    return value.flatMap((skills) =>
      typeof skills === "string" ? skills.split(",").map((v) => v.trim()) : []
    );
  }
  return [];
};


//------- BODY Validators for each field. --------
const userIdBody = body("userId").custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage("Invalid userId. Must be a valid MongoDB ObjectId");

const firstName = body("firstName").isString().trim().isLength({ min: 3, max: 50 }).withMessage("Firstname should be between 3 to 50 characters").escape();
const lastName = body("lastName").isString().trim().isLength({ min: 3, max: 50 }).withMessage("Lastname should be between 3 to 50 characters").escape();

const emailId = body("emailId").trim().isEmail().withMessage("Please enter a valid email").normalizeEmail({ gmail_remove_dots: false });
const password = body("password").isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage("Password must be strong (8+ chars, upper, lower, number, symbol)");

const age = body("age").isInt({ min: 18, max: 120 }).withMessage("Age must be between 18 and 120");
const gender = body("gender").toLowerCase().isIn(["male", "female", "others"]).withMessage("Gender must be either male, female, or others");

const about = body("about").isLength({ min: 20, max: 200 }).withMessage("About must be 10–200 characters");
// const skills = body("skills").customSanitizer((value) => { isValidSkill(value) }).isArray({ max: 10 }).withMessage("Skills must be an array with no more than 10 items");
const skills = body("skills").optional().isArray().withMessage("Skills must be an array").custom((value) => {
  if (!Array.isArray(value)) return false;
  return value.every(item => typeof item === 'string');
}).withMessage("Skills must be an array of strings")

const photoUrl = body("photoUrl").trim().isURL().withMessage("Provided URL is not valid");
const newPassword = body("newPassword").isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage("Password must be strong (8+ chars, upper, lower, number, symbol)");




// Param Validator: 
const userIdParam = param("userId").custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage("Invalid userId in URL param");


// Fort patch:
const signUpValidator = [userIdBody.optional(), firstName, lastName.optional(), emailId, password, age, gender.optional(), photoUrl.optional(), skills, about.optional()];
const patchValidator = [userIdBody.optional(), userIdParam.optional(), firstName.optional(), lastName.optional(), age.optional(),  gender.optional(), skills.optional(), photoUrl.optional(), about.optional()];
const deleteValidator = [userIdBody.optional(), emailId];
const userEmailValidator = [emailId]; 



const loginPassword = body("password").notEmpty().withMessage("Password is required");
const loginValidator = [emailId, loginPassword];
const patchPasswordValidator = [emailId, password, newPassword];

const allowedToUpdate = (req) => {
  const allowedFields = ["firstName", "lastName", "age", "gender", "photoUrl", "skills", "about"];
  const isEditAllowed = Object.keys(req.body).every((field) => (allowedFields.includes(field)));
  return isEditAllowed;
}



module.exports = { signUpValidator, loginValidator, userEmailValidator, patchValidator, deleteValidator, patchPasswordValidator, allowedToUpdate };