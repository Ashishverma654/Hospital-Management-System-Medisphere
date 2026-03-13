export const PHARMACY_STATUS = {
  PRESCRIBED: "prescribed",
  ORDER_PLACED: "orderPlaced",
  ORDER_ACCEPTED: "orderAccepted",
  AWAITING_PAYMENT: "awaitingPayment",
  PAID: "paid",
  PREPARING: "preparing",
  READY_FOR_PICKUP: "readyForPickup",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  PARTIALLY_FULFILLED: "partiallyFulfilled",
};

const normalizeLegacyStatus = (status) => {
  switch (status) {
    case "pending":
      return PHARMACY_STATUS.ORDER_PLACED;
    case "accepted":
      return PHARMACY_STATUS.ORDER_ACCEPTED;
    case "inProgress":
      return PHARMACY_STATUS.PREPARING;
    case "ready":
      return PHARMACY_STATUS.READY_FOR_PICKUP;
    default:
      return status;
  }
};

export const normalizePharmacyStatus = (status) =>
  normalizeLegacyStatus(status || PHARMACY_STATUS.PRESCRIBED);

export const normalizePaymentStatus = (status) => status || "pending";

export const canTransitionPharmacyOrder = (currentStatus, nextStatus) => {
  const current = normalizePharmacyStatus(currentStatus);
  const next = normalizePharmacyStatus(nextStatus);

  if (current === next) return true;

  const transitions = {
    [PHARMACY_STATUS.PRESCRIBED]: [
      PHARMACY_STATUS.ORDER_PLACED,
      PHARMACY_STATUS.CANCELLED,
    ],
    [PHARMACY_STATUS.ORDER_PLACED]: [
      PHARMACY_STATUS.ORDER_ACCEPTED,
      PHARMACY_STATUS.CANCELLED,
      PHARMACY_STATUS.PARTIALLY_FULFILLED,
      PHARMACY_STATUS.AWAITING_PAYMENT,
    ],
    [PHARMACY_STATUS.ORDER_ACCEPTED]: [
      PHARMACY_STATUS.PREPARING,
      PHARMACY_STATUS.AWAITING_PAYMENT,
      PHARMACY_STATUS.CANCELLED,
      PHARMACY_STATUS.PARTIALLY_FULFILLED,
    ],
    [PHARMACY_STATUS.AWAITING_PAYMENT]: [
      PHARMACY_STATUS.PAID,
      PHARMACY_STATUS.PREPARING,
      PHARMACY_STATUS.CANCELLED,
      PHARMACY_STATUS.PARTIALLY_FULFILLED,
    ],
    [PHARMACY_STATUS.PAID]: [
      PHARMACY_STATUS.PREPARING,
      PHARMACY_STATUS.READY_FOR_PICKUP,
      PHARMACY_STATUS.PARTIALLY_FULFILLED,
    ],
    [PHARMACY_STATUS.PREPARING]: [
      PHARMACY_STATUS.READY_FOR_PICKUP,
      PHARMACY_STATUS.PARTIALLY_FULFILLED,
      PHARMACY_STATUS.CANCELLED,
    ],
    [PHARMACY_STATUS.PARTIALLY_FULFILLED]: [
      PHARMACY_STATUS.READY_FOR_PICKUP,
      PHARMACY_STATUS.AWAITING_PAYMENT,
      PHARMACY_STATUS.PAID,
      PHARMACY_STATUS.CANCELLED,
    ],
    [PHARMACY_STATUS.READY_FOR_PICKUP]: [
      PHARMACY_STATUS.COMPLETED,
      PHARMACY_STATUS.AWAITING_PAYMENT,
      PHARMACY_STATUS.PAID,
    ],
    [PHARMACY_STATUS.COMPLETED]: [],
    [PHARMACY_STATUS.CANCELLED]: [],
  };

  return (transitions[current] || []).includes(next);
};

export const getOrderStatusForPayment = ({ currentStatus, paymentStatus }) => {
  const current = normalizePharmacyStatus(currentStatus);
  const payment = normalizePaymentStatus(paymentStatus);

  if (payment === "paid") {
    if ([PHARMACY_STATUS.ORDER_PLACED, PHARMACY_STATUS.ORDER_ACCEPTED].includes(current)) {
      return PHARMACY_STATUS.PAID;
    }
    if (current === PHARMACY_STATUS.AWAITING_PAYMENT) {
      return PHARMACY_STATUS.PAID;
    }
  }

  return current;
};

export const getOverallFulfillmentStatus = (items = []) => {
  if (!items.length) {
    return PHARMACY_STATUS.ORDER_PLACED;
  }

  const allCompleted = items.every(
    (item) => Number(item.fulfilledQuantity || 0) >= Number(item.requestedQuantity || 0)
  );
  const anyFulfilled = items.some((item) => Number(item.fulfilledQuantity || 0) > 0);
  const anyUnavailable = items.some((item) => Number(item.unavailableQuantity || 0) > 0);

  if (allCompleted) return PHARMACY_STATUS.COMPLETED;
  if (anyFulfilled || anyUnavailable) return PHARMACY_STATUS.PARTIALLY_FULFILLED;
  return null;
};
