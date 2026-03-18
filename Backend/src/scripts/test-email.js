import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const sendTestEmail = async () => {
  console.log("Starting email test...");
  console.log("User:", process.env.EMAIL_USER);
  console.log("Pass:", process.env.EMAIL_PASS ? "****" : "MISSING");

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("Transporter verified successfully!");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: "Mediflow Test Email",
      text: "This is a test email to verify SMTP configuration.",
    };

    console.log("Sending mail...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Detailed Email Error:", error);
  }
};

sendTestEmail();
