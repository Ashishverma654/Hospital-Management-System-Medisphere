import ShiftSchedule from "../models/ShiftSchedule.js";
import { notifyEmployee, notifyRole } from "../services/notificationService.js";

const GRACE_MINUTES = 30;
const MAX_HOURS = 12;

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);
const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const buildAutoCloseReason = (reason) => `Auto clock-out applied. ${reason}`;

const notifyAutoClose = async ({ duty, shift, reason }) => {
  const title = "Auto clock-out applied";
  const message = `${reason} Please review your duty record.`;
  const metadata = {
    dutyId: duty._id,
    shiftId: shift?._id,
    shiftType: shift?.shiftType || duty.shiftType,
    endTime: duty.endTime,
    totalHours: duty.totalHours,
  };

  await notifyEmployee({
    userId: duty.userId,
    type: "attendance",
    title,
    message,
    priority: "normal",
    sourceType: "staffDuty",
    sourceId: duty._id,
    metadata,
  });

  await Promise.all([
    notifyRole({
      role: "admin",
      type: "attendance",
      title,
      message,
      priority: "low",
      sourceType: "staffDuty",
      sourceId: duty._id,
      metadata,
    }),
    notifyRole({
      role: "superadmin",
      type: "attendance",
      title,
      message,
      priority: "low",
      sourceType: "staffDuty",
      sourceId: duty._id,
      metadata,
    }),
  ]);
};

const resolveShiftForDuty = async (duty) =>
  ShiftSchedule.findOne({
    userId: duty.userId,
    startTime: { $lte: duty.startTime },
    endTime: { $gte: duty.startTime },
  }).sort({ startTime: 1 });

export const autoCloseDutyIfNeeded = async ({
  duty,
  shift: providedShift,
  now = new Date(),
  notify = true,
}) => {
  if (!duty || duty.status !== "onDuty" || !duty.startTime) return null;

  const shift = providedShift || (await resolveShiftForDuty(duty));
  const startTime = new Date(duty.startTime);
  const maxEndTime = addHours(startTime, MAX_HOURS);

  let shouldClose = false;
  let endTime = null;
  let reason = "";

  if (shift?.endTime) {
    const shiftEnd = new Date(shift.endTime);
    const graceEnd = addMinutes(shiftEnd, GRACE_MINUTES);
    if (now >= graceEnd) {
      shouldClose = true;
      endTime = shiftEnd;
      reason = buildAutoCloseReason("Shift ended and was not clocked out.");
    }
  }

  if (!shouldClose && now >= maxEndTime) {
    shouldClose = true;
    endTime = maxEndTime;
    reason = buildAutoCloseReason("Maximum duty duration reached.");
  }

  if (!shouldClose || !endTime) return null;

  const totalHours = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
  duty.status = "offDuty";
  duty.endTime = endTime;
  duty.totalHours = Number(totalHours.toFixed(2));
  duty.isManualOverride = true;
  duty.reason = reason;
  await duty.save();

  if (notify) {
    await notifyAutoClose({ duty, shift, reason });
  }

  return duty;
};
