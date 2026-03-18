import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const getEmailAuth = () => {
  const user = (process.env.EMAIL_USER || "").trim();
  const passRaw = process.env.EMAIL_PASS || "";
  // App passwords are commonly copied with spaces; strip them safely.
  const pass = `${passRaw}`.replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error("Email credentials are missing. Set EMAIL_USER and EMAIL_PASS.");
  }

  return { user, pass };
};

const createTransporter = () => {
  const { user, pass } = getEmailAuth();
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

import { fileURLToPath } from "url";

const logEmail = (message) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logDir = path.resolve(__dirname, "../../logs");
    
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, "email.log");
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
    console.log(`[EMAIL_LOGGER] ${message}`);
  } catch (err) {
    console.error("FAILED TO WRITE EMAIL LOG:", err.message);
  }
};

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: (process.env.EMAIL_USER || "").trim(),
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
