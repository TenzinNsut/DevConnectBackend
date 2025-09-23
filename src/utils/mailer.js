const nodemailer = require("nodemailer");
// const { options } = require("../routes/authRouter");


const sendEmail = async (options) => {
    // 1. Create Transport Layer
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2. Define Mail options
    const mailOptions = {
        from: `iTenzin support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

