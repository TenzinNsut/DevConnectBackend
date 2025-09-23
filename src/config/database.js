const mongoose = require('mongoose');

const databaseName = "devTinder";
const URI = `mongodb+srv://tenlekshe_db_user:YrOvb0AT2XsVXSz0@namastenodejs.uhykrnr.mongodb.net/${databaseName}`;


// Connecting to Cluster: "mongoose.connect" returns a promise so wrap inside an async function
// adding /dbName connects/creates a new Database
const connectDB = async () => {
    await mongoose.connect(URI);
}


module.exports = connectDB;
