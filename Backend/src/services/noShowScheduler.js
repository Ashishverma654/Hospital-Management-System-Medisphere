import Appointment from "../models/Appointment.js";
import { logAudit } from "./auditLogService.js";
import { emitToRoom } from "./socketService.js";

const parseSlotDate = (date, slot) => {
  if (!date || !slot) return null;
  const parsed = new Date(`${date}T${slot}:00`);
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
