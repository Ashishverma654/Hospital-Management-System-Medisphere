import Appointment from "../models/Appointment.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import Token from "../models/Token.js";
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

const getSlotDurationMinutes = async (appointment) => {
  const fallback = Number(process.env.CONSULTATION_SLOT_FALLBACK_MINUTES || 15);
  const date = appointment.date;
  if (!date || !appointment.doctorId) return fallback;
  const dayLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
  const availability = await DoctorAvailability.findOne({
    doctorId: appointment.doctorId,
    dayOfWeek: dayLabel,
  }).select("slotDuration");
  return Number(availability?.slotDuration || fallback);
};

const shouldAutoComplete = async ({ appointment, now, graceMinutes }) => {
  const slotTime = parseSlotDate(appointment.date, appointment.slot);
  if (!slotTime) return false;
  const durationMinutes = await getSlotDurationMinutes(appointment);
  const endTime = new Date(slotTime.getTime() + durationMinutes * 60 * 1000);
  const graceMs = graceMinutes * 60 * 1000;
  return now.getTime() > endTime.getTime() + graceMs;
};

const emitQueueUpdate = (appointment) => {
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
};

export const runConsultationAutoCompleteSweep = async () => {
  const graceMinutes = Number(process.env.CONSULTATION_AUTO_COMPLETE_GRACE_MINUTES || 15);
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const candidates = await Appointment.find({
    status: "inConsultation",
    date: { $lte: today },
  });

  for (const appointment of candidates) {
    if (!(await shouldAutoComplete({ appointment, now, graceMinutes }))) continue;

    appointment.status = "completed";
    await appointment.save();

    await Token.findOneAndUpdate(
      { appointmentId: appointment._id },
      { $set: { status: "Completed" } },
      { returnDocument: "after" }
    );

    await logAudit({
      actor: { id: "system", name: "system", role: "system" },
      action: "appointment_auto_completed",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { date: appointment.date, slot: appointment.slot },
    });

    emitToRoom(`doctor_${appointment.doctorId}`, "consultation:completed", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      auto: true,
    });
    emitToRoom(`patient_${appointment.patientId}`, "consultation:completed", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      auto: true,
    });
    emitQueueUpdate(appointment);
  }
};

export const startConsultationAutoCompleteScheduler = () => {
  const enabled = String(process.env.CONSULTATION_AUTO_COMPLETE_ENABLED || "true").toLowerCase() === "true";
  if (!enabled) return;

  const intervalMinutes = Number(process.env.CONSULTATION_AUTO_COMPLETE_INTERVAL_MINUTES || 5);
  const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

  runConsultationAutoCompleteSweep().catch(() => null);
  setInterval(() => runConsultationAutoCompleteSweep().catch(() => null), intervalMs);
};
