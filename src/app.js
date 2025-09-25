const express = require("express");
const app = express();
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors")

require("dotenv").config({ path: __dirname + "/../.env" });


// const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean"); 


// Routers
const authRouter = require("./routes/authRouter");
const requestRouter = require("./routes/requestRouter");
const profileRouter  = require("./routes/profileRouter");
const userRouter = require("./routes/userRouter");


// Middleware
// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials:true
// })); // Used to resolve CORS error

 // To this (replace with your actual Vercel URL):
const allowedOrigins = [
    "http://localhost:5173",
    "https://dev-connect-front-end.vercel.app" // <-- Add 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));



app.use(express.json());           // Parse JSON: Must be applied before
app.use(cookieParser());           // Tp parse the cookies
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


// app.use(helmet());                 // Secure headers
// app.use(mongoSanitize());          // Prevent NoSQL injection
// app.use(xss());                    // Prevent XSS


// Add user data to Database:
// 👉 Needs full validation (signupValidator).

app.use("/", authRouter);
app.use("/", userRouter)
app.use("/", profileRouter);
app.use("/", requestRouter);



const port = process.env.PORT || 5000

connectDB().then(() => {
    console.log("DB connection established successfully");
    app.listen(port, () => {
        console.log(`Server is listening to requests at http://localhost:${port}/`);
    })
}).catch((err) => {
    console.error("DB connection failed! " + err);
})
