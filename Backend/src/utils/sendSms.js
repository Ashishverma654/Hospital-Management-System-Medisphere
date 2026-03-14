export const sendSms = async (phone, message) => {
  if (!phone) return;
  // Placeholder: integrate SMS provider (Twilio, MSG91, etc.) here.
  // For now, log to server console.
  console.log(`[SMS] ${phone}: ${message}`);
};
