import Appointment from "../models/Appointment.js";
import { logAudit } from "./auditLogService.js";
import { emitToRoom } from "./socketService.js";

const parseSlotDate = (date, slot) => {
  if (!date || !slot) return null;
  const raw = String(slot).split("-")[0].trim();
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const parsed = new Date(`${date}T${hh}:${mm}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const shouldMarkNoShow = ({ appointment, now, graceMinutes }) => {
  const slotTime = parseSlotDate(appointment.date, appointment.slot);
  if (!slotTime) return false;
  const graceMs = graceMinutes * 60 * 1000;
  return now.getTime() > slotTime.getTime() + graceMs;
};

export const runNoShowSweep = async () => {
  const graceMinutes = Number(process.env.NO_SHOW_GRACE_MINUTES || 20);
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const candidates = await Appointment.find({
    status: { $in: ["booked", "confirmed"] },
    date: { $lte: today },
  });

  for (const appointment of candidates) {
    if (!shouldMarkNoShow({ appointment, now, graceMinutes })) continue;

    appointment.status = "no-show";
    await appointment.save();

    await logAudit({
      actor: { id: "system", name: "system", role: "system" },
      action: "appointment_no_show",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { date: appointment.date, slot: appointment.slot },
    });

    emitToRoom(`doctor_${appointment.doctorId}`, "queue:update", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      status: appointment.status,
    });
    emitToRoom("reception", "queue:update", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      status: appointment.status,
    });
  }
};

export const startNoShowScheduler = () => {
  const enabled = String(process.env.NO_SHOW_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) return;

  const intervalMinutes = Number(process.env.NO_SHOW_INTERVAL_MINUTES || 5);
  const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

  runNoShowSweep().catch(() => null);
  setInterval(() => runNoShowSweep().catch(() => null), intervalMs);
};
