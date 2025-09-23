// middlewares/handleValidationErrors.js
const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((err) => ({
        field: err.param,   // the field name that failed validation
        message: err.msg,   // the validation error message
      })),
    });
  }
  next();
};

module.exports = { handleValidationErrors };
