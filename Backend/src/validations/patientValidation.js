import Joi from "joi";

export const patientSchema = Joi.object({
  userId: Joi.string().required(),

  age: Joi.number().required(),

  bloodGroup: Joi.string().valid(
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
  ),

  height: Joi.number(),

  weight: Joi.number(),

  allergies: Joi.array().items(Joi.string()),

  chronicDiseases: Joi.array().items(Joi.string()),
});
