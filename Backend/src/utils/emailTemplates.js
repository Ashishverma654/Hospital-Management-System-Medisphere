const brandDefaults = {
  name: "Medisphere",
  supportEmail: process.env.SUPPORT_EMAIL || "support@medisphere.tech",
  loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/employee/login` : "https://medisphere.tech/employee/login",
  patientLoginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/patient/login` : "https://medisphere.tech/patient/login",
};

const escapeHtml = (value = "") =>
  `${value}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const baseTemplate = ({ title, preheader, bodyHtml, ctaUrl, ctaText, footerNote }) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; background-color: #f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
      .wrapper { width: 100%; padding: 32px 16px; }
      .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #16a34a, #14b8a6); padding: 28px 32px; color: #fff; }
      .header h1 { margin: 0; font-size: 22px; }
      .content { padding: 28px 32px; }
      .content p { margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #334155; }
      .pill { display: inline-block; padding: 10px 16px; border-radius: 999px; background: #f1f5f9; color: #0f172a; font-weight: 600; letter-spacing: 0.02em; }
      .cta { margin: 18px 0 6px; }
      .cta a { display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 999px; font-weight: 600; }
      .muted { font-size: 13px; color: #64748b; }
      .footer { padding: 20px 32px 28px; background: #f8fafc; font-size: 12px; color: #64748b; }
      .divider { height: 1px; background: #e2e8f0; margin: 18px 0; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <span style="display:none;">${escapeHtml(preheader || "")}</span>
      <div class="card">
        <div class="header">
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="content">
          ${bodyHtml}
          ${ctaUrl && ctaText ? `<div class="cta"><a href="${ctaUrl}">${escapeHtml(ctaText)}</a></div>` : ""}
        </div>
        <div class="footer">
          ${footerNote || "If you did not request this, please ignore this email or contact support."}
        </div>
      </div>
    </div>
  </body>
</html>`;

export const buildForgotPasswordTemplate = ({ name, otp, expiresMinutes = 15 }) => {
  const safeName = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const title = "Password reset request";
  const bodyHtml = `
    <p>${safeName}</p>
    <p>We received a request to reset your Medisphere account password. Use the OTP below to continue.</p>
    <p class="pill">${escapeHtml(otp)}</p>
    <p class="muted">This OTP expires in ${escapeHtml(expiresMinutes)} minutes.</p>
    <div class="divider"></div>
    <p class="muted">If this wasn’t you, please contact ${escapeHtml(brandDefaults.supportEmail)} immediately.</p>
  `;
  const text = `Password reset OTP: ${otp}\nThis OTP expires in ${expiresMinutes} minutes.\nIf this wasn’t you, contact ${brandDefaults.supportEmail}.`;
  return {
    subject: "Password reset OTP - Medisphere",
    html: baseTemplate({ title, preheader: "Use this OTP to reset your password.", bodyHtml }),
    text,
  };
};

export const buildEmployeeCredentialsTemplate = ({
  name,
  roleLabel,
  email,
  employeeId,
  temporaryPassword,
  loginUrl = brandDefaults.loginUrl,
}) => {
  const safeName = name ? `Hello ${escapeHtml(name)},` : "Hello,";
  const title = `${roleLabel} account credentials`;
  const bodyHtml = `
    <p>${safeName}</p>
    <p>Your Medisphere staff account is ready. Use the credentials below to sign in.</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${employeeId ? `<p><strong>Employee ID:</strong> ${escapeHtml(employeeId)}</p>` : ""}
    <p><strong>Temporary Password:</strong> ${escapeHtml(temporaryPassword)}</p>
    <p class="muted">Please change your password after first login.</p>
  `;
  const text = `Your Medisphere ${roleLabel} account is ready.\nEmail: ${email}\nEmployee ID: ${employeeId || "—"}\nTemporary Password: ${temporaryPassword}\nLogin: ${loginUrl}\nPlease change your password after first login.`;
  return {
    subject: `Welcome to Medisphere - ${roleLabel} account`,
    html: baseTemplate({
      title,
      preheader: "Your Medisphere staff credentials",
      bodyHtml,
      ctaUrl: loginUrl,
      ctaText: "Open Staff Portal",
    }),
    text,
  };
};

export const buildAppointmentBookedTemplate = ({ name, date, slot }) => {
  const safeName = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const title = "Appointment confirmed";
  const bodyHtml = `
    <p>${safeName}</p>
    <p>Your appointment has been confirmed.</p>
    <p><strong>Date:</strong> ${escapeHtml(date)}</p>
    <p><strong>Time:</strong> ${escapeHtml(slot)}</p>
    <p class="muted">Please arrive 10-15 minutes early with a valid ID.</p>
  `;
  const text = `Your appointment is confirmed.\nDate: ${date}\nTime: ${slot}\nPlease arrive 10-15 minutes early.`;
  return {
    subject: "Appointment confirmed - Medisphere",
    html: baseTemplate({
      title,
      preheader: "Your appointment is confirmed.",
      bodyHtml,
      ctaUrl: brandDefaults.patientLoginUrl,
      ctaText: "View appointment",
    }),
    text,
  };
};

export const buildAppointmentCancelledTemplate = ({ name, date, slot, reason }) => {
  const safeName = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const title = "Appointment cancelled";
  const reasonHtml = reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : "";
  const bodyHtml = `
    <p>${safeName}</p>
    <p>Your appointment has been cancelled.</p>
    <p><strong>Date:</strong> ${escapeHtml(date)}</p>
    <p><strong>Time:</strong> ${escapeHtml(slot)}</p>
    ${reasonHtml}
    <p class="muted">You can rebook anytime from your patient portal.</p>
  `;
  const text = `Your appointment was cancelled.\nDate: ${date}\nTime: ${slot}${reason ? `\nReason: ${reason}` : ""}`;
  return {
    subject: "Appointment cancelled - Medisphere",
    html: baseTemplate({
      title,
      preheader: "Your appointment was cancelled.",
      bodyHtml,
      ctaUrl: brandDefaults.patientLoginUrl,
      ctaText: "Book another visit",
    }),
    text,
  };
};

export const buildInvoiceReadyTemplate = ({ name, invoiceNumber, amount, link }) => {
  const safeName = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const title = "Invoice ready";
  const bodyHtml = `
    <p>${safeName}</p>
    <p>Your invoice is ready for review.</p>
    ${invoiceNumber ? `<p><strong>Invoice:</strong> ${escapeHtml(invoiceNumber)}</p>` : ""}
    ${amount ? `<p><strong>Total:</strong> ₹${escapeHtml(amount)}</p>` : ""}
    <p class="muted">You can view, download, or pay the invoice from your portal.</p>
  `;
  const text = `Your invoice is ready.${invoiceNumber ? `\nInvoice: ${invoiceNumber}` : ""}${amount ? `\nTotal: ₹${amount}` : ""}`;
  return {
    subject: "Invoice ready - Medisphere",
    html: baseTemplate({
      title,
      preheader: "Your invoice is ready.",
      bodyHtml,
      ctaUrl: link || brandDefaults.patientLoginUrl,
      ctaText: "View invoice",
    }),
    text,
  };
};

export const buildLabReportReadyTemplate = ({ name, reportName, link }) => {
  const safeName = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const title = "Lab report ready";
  const bodyHtml = `
    <p>${safeName}</p>
    <p>Your lab report is now available.</p>
    ${reportName ? `<p><strong>Report:</strong> ${escapeHtml(reportName)}</p>` : ""}
    <p class="muted">You can view or download the report from your portal.</p>
  `;
  const text = `Your lab report is ready.${reportName ? `\nReport: ${reportName}` : ""}`;
  return {
    subject: "Lab report ready - Medisphere",
    html: baseTemplate({
      title,
      preheader: "Your lab report is ready.",
      bodyHtml,
      ctaUrl: link || brandDefaults.patientLoginUrl,
      ctaText: "View report",
    }),
    text,
  };
};
