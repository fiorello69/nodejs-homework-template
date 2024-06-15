// nodemailer/nodemailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export default function sendEmailTo(email, token) {
  const nodemailerConfig = {
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUTLOOK_EMAIL,
      pass: process.env.OUTLOOK_PASSWORD,
    },
  };

  const transporter = nodemailer.createTransport(nodemailerConfig);

  const verificationUrl = `http://localhost:3000/api/users/verify/${token}`;

  const mailOptions = {
    from: "vbreban@hotmail.com",
    to: email,
    subject: "Email Verification",
    text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
