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


app.set('trust proxy', 1); // Trust the first proxy

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
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
