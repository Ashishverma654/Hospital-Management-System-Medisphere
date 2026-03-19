import Joi from "joi";

export const addMedicineSchema = Joi.object({
  name: Joi.string().trim().required(),
  manufacturer: Joi.string().trim(),
  category: Joi.string().trim(),
  price: Joi.alternatives().try(Joi.number(), Joi.string()),
  stock: Joi.alternatives().try(Joi.number(), Joi.string()),
  lowStockThreshold: Joi.alternatives().try(Joi.number(), Joi.string()),
  expiryDate: Joi.string().allow(""),
  supplier: Joi.string().trim(),
  batchNumber: Joi.string().trim(),
  unit: Joi.string().trim(),
  isActive: Joi.boolean(),
}).unknown(true);

export const updateMedicineSchema = Joi.object({
  name: Joi.string().trim(),
  manufacturer: Joi.string().trim(),
  category: Joi.string().trim(),
  price: Joi.alternatives().try(Joi.number(), Joi.string()),
  stock: Joi.alternatives().try(Joi.number(), Joi.string()),
  lowStockThreshold: Joi.alternatives().try(Joi.number(), Joi.string()),
  expiryDate: Joi.string().allow(""),
  supplier: Joi.string().trim(),
  batchNumber: Joi.string().trim(),
  unit: Joi.string().trim(),
  isActive: Joi.boolean(),
  adjustmentNote: Joi.string().allow(""),
}).unknown(true);

export const placeOrderFromPrescriptionSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      prescriptionMedicineIndex: Joi.alternatives().try(Joi.number(), Joi.string()),
      quantity: Joi.alternatives().try(Joi.number(), Joi.string()),
    }).unknown(true)
  ),
  notes: Joi.string().allow(""),
}).unknown(true);

export const pharmacyOrderItemsSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      index: Joi.alternatives().try(Joi.number(), Joi.string()),
      medicineId: Joi.string(),
      fulfilledQuantity: Joi.alternatives().try(Joi.number(), Joi.string()),
    }).unknown(true)
  ),
}).unknown(true);
