export const LAB_STATUS_ORDER = [
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
];

export const LEGACY_LAB_ORDER_STATUS_MAP = {
  pending: "ordered",
  inProgress: "inProcessing",
  released: "reportReleasedToPortal",
};

export const LEGACY_LAB_ITEM_STATUS_MAP = {
  pending: "ordered",
  processing: "inProcessing",
  released: "reportReleasedToPortal",
};

export const normalizeLabOrderStatus = (status) =>
  LEGACY_LAB_ORDER_STATUS_MAP[status] || status || "ordered";

export const normalizeLabItemStatus = (status) =>
  LEGACY_LAB_ITEM_STATUS_MAP[status] || status || "ordered";

export const isPaidPaymentStatus = (status) => status === "paid";

export const toStructuredSchedule = ({ date, time, notes, assignedBy, currentValue }) => {
  if (!date || !time) {
    return null;
  }

  const combinedAt = new Date(`${date}T${time}:00`);

  return {
    date,
    time,
    notes: notes || currentValue?.notes || "",
    scheduledAt: combinedAt,
    scheduledBy: assignedBy || currentValue?.scheduledBy || null,
    updatedAt: new Date(),
  };
};

export const getOrderStatusForPayment = ({ currentStatus, paymentStatus }) => {
  const normalizedStatus = normalizeLabOrderStatus(currentStatus);

  if (paymentStatus === "paid") {
    return ["ordered", "awaitingPayment", "paid"].includes(normalizedStatus)
      ? "paid"
      : normalizedStatus;
  }

  if (["ordered", "awaitingPayment", "paid"].includes(normalizedStatus)) {
    return "awaitingPayment";
  }

  return normalizedStatus;
};

export const getPublicReportVisibility = ({ report, orderPaymentStatus, orderReleasedToPortal }) =>
  Boolean(
    report &&
      report.releasedToPortal &&
      orderReleasedToPortal &&
      isPaidPaymentStatus(orderPaymentStatus)
  );
