# DevConnect Backend

## Description
This is the backend API for DevConnect, a platform designed to connect developers. It provides user authentication, profile management, connection request handling, and a feed generation system.

## Features
*   User Authentication (Signup, Login, Logout)
*   User Profile Management (View, Edit, Delete)
*   Password Reset functionality
*   Connection Request System (Send, Review, Accept/Reject)
*   Dynamic User Feed Generation
*   Secure API with JWT-based authentication

## Technologies Used
*   Node.js
*   Express.js
*   MongoDB (via Mongoose)
*   JWT (JSON Web Tokens) for authentication
*   Bcrypt for password hashing
*   Nodemailer for email services
*   Express-validator for input validation
*   CORS for cross-origin resource sharing
*   Dotenv for environment variable management

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd DevTinder/Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `Backend` directory with the following variables:
```
PORT=3000
JWT_SECRET_KEY=<your_jwt_secret_key>
DB_URI=<your_mongodb_connection_string>
EMAIL_HOST=<your_email_host>
EMAIL_PORT=<your_email_port>
EMAIL_USER=<your_email_username>
EMAIL_PASSWORD=<your_email_password>
FRONTEND_URL=http://localhost:5173
```
*   Replace `<your_jwt_secret_key>` with a strong, random string.
*   Replace `<your_mongodb_connection_string>` with your MongoDB Atlas or local MongoDB connection string.
*   Replace email credentials with your email service provider details (e.g., Gmail, SendGrid).

### 4. Running the Server
*   **Development:**
```bash
npm run dev
```
*   **Production:**
```bash
npm start
```

## API Endpoints (Overview)

*   `POST /signup`: Register a new user.
*   `POST /login`: Authenticate user and get JWT.
*   `POST /logout`: Log out user.
*   `GET /profile/view`: View authenticated user's profile.
*   `PATCH /profile/edit`: Update authenticated user's profile.
*   `DELETE /delete`: Delete authenticated user's account.
*   `POST /forgot-password`: Initiate password reset.
*   `PATCH /reset-password`: Reset password with token.
*   `POST /request/send/:status/:toUserId`: Send a connection request.
*   `POST /request/review/:status/:requestId`: Review a connection request (accept/reject).
*   `GET /user/requests/received`: Get received connection requests.
*   `GET /user/connections`: Get accepted connections.
*   `GET /user/feed`: Get a feed of potential connections.

