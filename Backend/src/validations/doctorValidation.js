import Joi from "joi";

export const createDoctorSchema = Joi.object({
  name: Joi.string().trim(),
  firstName: Joi.string().trim(),
  middleName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim(),
  alternativeContact: Joi.string().trim(),
  bloodGroup: Joi.string().trim(),
  address: Joi.string().trim(),
  city: Joi.string().trim(),
  state: Joi.string().trim(),
  postalCode: Joi.string().trim(),
  departmentId: Joi.string().required(),
  specializationIds: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  hospitalLocations: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  title: Joi.string().trim(),
  qualifications: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  education: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  certifications: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  licenseNumber: Joi.string().trim(),
  licenseExpiryDate: Joi.string().trim(),
  joiningDate: Joi.string().trim(),
  roomNumber: Joi.string().trim(),
  emergencyContactName: Joi.string().trim(),
  emergencyContactNumber: Joi.string().trim(),
  emergencyContactRelationship: Joi.string().trim(),
  docLicense: Joi.string().trim(),
  docEducation: Joi.string().trim(),
  docAdditional: Joi.string().trim(),
  experienceYears: Joi.alternatives().try(Joi.number(), Joi.string()),
  consultationFee: Joi.alternatives().try(Joi.number(), Joi.string()),
  consultationFeeVideo: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.allow(null)),
  consultationFeePhone: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.allow(null)),
  about: Joi.string().allow(""),
  expertise: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  articles: Joi.alternatives().try(Joi.array(), Joi.string()),
  media: Joi.alternatives().try(Joi.array(), Joi.string()),
  locationFees: Joi.alternatives().try(Joi.array(), Joi.string()),
  profileImage: Joi.string().trim(),
  isPublished: Joi.boolean(),
  isActive: Joi.boolean(),
})
  .custom((value, helpers) => {
    const hasName = value.name && `${value.name}`.trim();
    const hasFirstLast = value.firstName && value.lastName;
    if (!hasName && !hasFirstLast) {
      return helpers.error("any.custom", { message: "name or firstName+lastName is required" });
    }
    return value;
  }, "name or firstName+lastName requirement")
  .unknown(true);
