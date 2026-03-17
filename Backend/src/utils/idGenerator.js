import mongoose from "mongoose";

/**
 * Generates a unique ID with a given prefix.
 * @param {mongoose.Model} Model - The Mongoose model to check for existing IDs.
 * @param {string} fieldName - The name of the field containing the unique ID (e.g., 'employeeId', 'patientId').
 * @param {string} prefix - The prefix for the ID (e.g., 'DOC', 'NURS', 'PAT').
 * @returns {Promise<string>} - The generated unique ID.
 */
export const generateUniqueId = async (Model, fieldName, prefix) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  let isUnique = false;
  let generatedId = "";

  while (!isUnique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
    generatedId = `${prefix}-${currentYear}${randomDigits}`;
    
    const existing = await Model.findOne({ [fieldName]: generatedId });
    if (!existing) {
      isUnique = true;
    }
  }

  return generatedId;
};
