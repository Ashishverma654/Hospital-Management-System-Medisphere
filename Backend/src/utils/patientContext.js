import Patient from "../models/Patient.js";
import User from "../models/User.js";

const isObjectId = (value) => value && /^[a-f\d]{24}$/i.test(String(value));

export const ensurePatientProfileForUser = async (userId, profilePatch = {}) => {
  const user = await User.findById(userId);

  if (!user || user.role !== "patient") {
    throw new Error("Patient user not found.");
  }

  let patient = await Patient.findOne({ userId: user._id });

  if (!patient) {
    patient = await Patient.create({
      userId: user._id,
      dateOfBirth: user.dob,
      ...profilePatch,
    });
  }

  return { patient, user };
};

export const resolvePatientContext = async (input) => {
  if (!input) {
    throw new Error("Patient reference is required.");
  }

  if (isObjectId(input)) {
    const patient = await Patient.findById(input).populate("userId");
    if (patient) {
      return { patient, user: patient.userId };
    }

    const user = await User.findById(input);
    if (user?.role === "patient") {
      return ensurePatientProfileForUser(user._id);
    }
  }

  const user = await User.findOne({
    $or: [{ patientId: input }, { email: input }],
    role: "patient",
  });

  if (!user) {
    throw new Error("Patient not found.");
  }

  return ensurePatientProfileForUser(user._id);
};

export const findPatientProfileByUserId = async (userId) => {
  const patient = await Patient.findOne({ userId });
  return patient;
};
