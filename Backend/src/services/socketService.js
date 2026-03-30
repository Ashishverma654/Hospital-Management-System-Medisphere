import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Appointment from "../models/Appointment.js";

let ioInstance = null;

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_APP_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const isAllowedLocalOrigin = (origin = "") =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const verifySocketToken = (socket) => {
  const token =
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization?.split(" ")[1] ||
    socket.handshake?.headers?.Authorization?.split(" ")[1];

  if (!token) {
    throw new Error("Authentication token missing.");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

export const initSocket = (httpServer) => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (configuredOrigins.includes(origin) || isAllowedLocalOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const decoded = verifySocketToken(socket);
      socket.user = decoded;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.on("join", ({ doctorId, patientId, role }) => {
      if (doctorId) socket.join(`doctor_${doctorId}`);
      if (patientId) socket.join(`patient_${patientId}`);
      if (role === "receptionist") socket.join("reception");
    });

    socket.on("join-room", async ({ appointmentId }) => {
      if (!appointmentId) {
        socket.emit("join-error", { message: "Appointment id is required." });
        return;
      }

      const appointment = await Appointment.findById(appointmentId).select(
        "doctorUserId patientId consultationMode status"
      );

      if (!appointment) {
        socket.emit("join-error", { message: "Appointment not found." });
        return;
      }

      if (appointment.consultationMode !== "video") {
        socket.emit("join-error", { message: "Video consultation is not enabled for this appointment." });
        return;
      }

      const userId = socket.user?.id;
      const isDoctor = userId && `${appointment.doctorUserId}` === `${userId}`;
      const isPatient = userId && `${appointment.patientId}` === `${userId}`;

      if (!isDoctor && !isPatient) {
        socket.emit("join-error", { message: "You are not authorized for this appointment." });
        return;
      }

      const room = `appointment_${appointmentId}`;
      socket.join(room);
      socket.emit("joined-room", { appointmentId, role: isDoctor ? "doctor" : "patient" });
      socket.to(room).emit("participant-joined", { appointmentId, role: isDoctor ? "doctor" : "patient" });
    });

    socket.on("offer", ({ appointmentId, offer }) => {
      if (!appointmentId || !offer) return;
      socket.to(`appointment_${appointmentId}`).emit("offer", { offer });
    });

    socket.on("answer", ({ appointmentId, answer }) => {
      if (!appointmentId || !answer) return;
      socket.to(`appointment_${appointmentId}`).emit("answer", { answer });
    });

    socket.on("ice-candidate", ({ appointmentId, candidate }) => {
      if (!appointmentId || !candidate) return;
      socket.to(`appointment_${appointmentId}`).emit("ice-candidate", { candidate });
    });

    socket.on("end-call", ({ appointmentId, reason }) => {
      if (!appointmentId) return;
      socket.to(`appointment_${appointmentId}`).emit("call-ended", {
        appointmentId,
        reason: reason || "Call ended",
      });
    });

    socket.on("disconnect", () => {
      if (!socket.user?.id) return;
      socket.rooms.forEach((room) => {
        if (room.startsWith("appointment_")) {
          socket.to(room).emit("participant-left", { room });
        }
      });
    });
  });

  return ioInstance;
};

export const getSocket = () => ioInstance;

export const emitToRoom = (room, event, payload) => {
  if (!ioInstance || !room) return;
  ioInstance.to(room).emit(event, payload);
};
