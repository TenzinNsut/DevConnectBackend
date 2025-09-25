const mongoose = require('mongoose');



// Connecting to Cluster: "mongoose.connect" returns a promise so wrap inside an async function
// adding /dbName connects/creates a new Database
const connectDB = async () => {
    if (!process.env.DB_URI) {
        throw new Error("DB_URI is not defined in environment variables.Please check your.env file.");
    }
    await mongoose.connect(process.env.DB_URI);
}


module.exports = connectDB;
