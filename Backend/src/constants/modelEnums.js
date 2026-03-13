export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const APPOINTMENT_STATUSES = ["booked", "confirmed", "arrived", "waiting", "checked-in", "inConsultation", "completed", "cancelled", "no-show"];
export const VISIT_TYPES = ["newConsultation", "followUp", "walkIn"];
export const BED_STATUSES = ["available", "occupied", "maintenance", "reserved", "cleaning"];
export const BILL_TYPES = ["consultation", "lab", "pharmacy", "ward", "mixed", "other"];
export const PAYMENT_STATUSES = ["pending", "partiallyPaid", "paid", "refunded", "cancelled"];
export const PAYMENT_METHODS = ["cash", "card", "upi", "insurance", "bank-transfer", "wallet"];

export const LAB_ORDER_STATUSES = [
  "ordered",
  "awaitingPayment",
  "paid",
  "sampleScheduled",
  "sampleCollected",
  "inProcessing",
  "reportReady",
  "reportAvailableForPickup",
  "reportReleasedToPortal",
  "completed",
  "cancelled",
  // Legacy values kept for backward compatibility with older records.
  "pending",
  "inProgress",
  "released",
];
export const LAB_ITEM_STATUSES = [
  "ordered",
  "awaitingPayment",
  "paid",
  "sampleScheduled",
  "sampleCollected",
  "inProcessing",
  "reportReady",
  "reportAvailableForPickup",
  "reportReleasedToPortal",
  "completed",
  "cancelled",
  // Legacy values kept for backward compatibility with older records.
  "pending",
  "processing",
  "released",
];
export const LAB_ORDER_URGENCY = ["routine", "urgent", "stat"];

export const PHARMACY_ORDER_STATUSES = [
  "prescribed",
  "orderPlaced",
  "orderAccepted",
  "awaitingPayment",
  "paid",
  "preparing",
  "readyForPickup",
  "completed",
  "cancelled",
  "partiallyFulfilled",
  // Legacy values retained for older data compatibility.
  "pending",
  "accepted",
  "inProgress",
  "ready",
];
export const PHARMACY_ITEM_STATUSES = [
  "prescribed",
  "orderPlaced",
  "orderAccepted",
  "awaitingPayment",
  "paid",
  "preparing",
  "readyForPickup",
  "completed",
  "cancelled",
  "partiallyFulfilled",
  "outOfStock",
  // Legacy values retained for older data compatibility.
  "pending",
  "accepted",
  "inProgress",
  "ready",
];
export const ORDER_STATUSES = PHARMACY_ORDER_STATUSES;
export const ORDER_PAYMENT_STATUSES = ["pending", "partiallyPaid", "paid", "refunded", "cancelled"];

export const NURSING_TASK_STATUSES = ["pending", "inProgress", "completed", "cancelled"];
export const NURSING_NOTE_TYPES = ["general", "assessment", "medication", "incident", "handover", "discharge"];
export const HANDOVER_PRIORITIES = ["low", "medium", "high", "critical"];

export const SHIFT_TYPES = ["morning", "afternoon", "evening", "night", "custom"];
export const WARD_TYPES = ["general", "semi-private", "private", "icu", "nicu", "picu", "emergency", "maternity", "isolation"];
export const AWARD_TYPES = ["hospital", "doctor"];
export const ENTITY_STATUSES = ["draft", "active", "inactive", "archived"];
