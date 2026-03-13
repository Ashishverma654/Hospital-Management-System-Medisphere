export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const APPOINTMENT_STATUSES = ["booked", "confirmed", "checked-in", "completed", "cancelled", "no-show"];
export const BED_STATUSES = ["available", "occupied", "maintenance", "reserved", "cleaning"];
export const BILL_TYPES = ["consultation", "lab", "pharmacy", "ward", "mixed", "other"];
export const PAYMENT_STATUSES = ["pending", "partiallyPaid", "paid", "refunded", "cancelled"];
export const PAYMENT_METHODS = ["cash", "card", "upi", "insurance", "bank-transfer", "wallet"];

export const LAB_ORDER_STATUSES = ["pending", "sampleCollected", "inProgress", "completed", "released", "cancelled"];
export const LAB_ITEM_STATUSES = ["pending", "sampleCollected", "processing", "completed", "released", "cancelled"];
export const LAB_ORDER_URGENCY = ["routine", "urgent", "stat"];

export const ORDER_STATUSES = ["pending", "accepted", "inProgress", "ready", "completed", "cancelled"];
export const ORDER_PAYMENT_STATUSES = ["pending", "partiallyPaid", "paid", "refunded", "cancelled"];

export const NURSING_TASK_STATUSES = ["pending", "inProgress", "completed", "cancelled"];
export const NURSING_NOTE_TYPES = ["general", "assessment", "medication", "incident", "handover", "discharge"];
export const HANDOVER_PRIORITIES = ["low", "medium", "high", "critical"];

export const SHIFT_TYPES = ["morning", "afternoon", "evening", "night", "custom"];
export const WARD_TYPES = ["general", "semi-private", "private", "icu", "nicu", "picu", "emergency", "maternity", "isolation"];
export const AWARD_TYPES = ["hospital", "doctor"];
export const ENTITY_STATUSES = ["draft", "active", "inactive", "archived"];
