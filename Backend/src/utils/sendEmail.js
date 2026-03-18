import nodemailer from "nodemailer";
import https from "https";
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

const sendResendEmail = ({ to, subject, text }) =>
  new Promise((resolve, reject) => {
    const apiKey = (process.env.RESEND_API_KEY || "").trim();
    const from =
      (process.env.RESEND_FROM || process.env.EMAIL_USER || "").trim();

    if (!apiKey) {
      return reject(new Error("RESEND_API_KEY is missing."));
    }
    if (!from) {
      return reject(new Error("RESEND_FROM (or EMAIL_USER) is missing."));
    }

    const payload = JSON.stringify({
      from,
      to,
      subject,
      text,
    });

    const request = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 15000,
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            return resolve({ status: response.statusCode, body });
          }
          return reject(new Error(`Resend API error (${response.statusCode}): ${body}`));
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Resend API request timeout"));
    });
    request.on("error", (err) => reject(err));
    request.write(payload);
    request.end();
  });

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
    if (process.env.RESEND_API_KEY) {
      const info = await sendResendEmail({ to, subject, text });
      logEmail(`SUCCESS: Resend email sent to ${to}. Status: ${info.status}`);
      return info;
    }

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
