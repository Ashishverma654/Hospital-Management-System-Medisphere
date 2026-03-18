import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Initialize transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const logEmail = (message) => {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, "email.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
};

export const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logEmail(`SUCCESS: Email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logEmail(`ERROR: Failed to send email to ${to}. Error: ${error.message}`);
    console.error("Email error:", error);
    throw error; // Rethrow to let the caller handle it if needed
  }
};
