import User from "../models/User.js";
import StaffDuty from "../models/StaffDuty.js";
import ShiftSchedule from "../models/ShiftSchedule.js";
import Doctor from "../models/Doctor.js";
import Nurse from "../models/Nurse.js";
import LabTechnician from "../models/LabTechnician.js";
import Pharmacist from "../models/Pharmacist.js";
import Receptionist from "../models/Receptionist.js";
import { EMPLOYEE_ROLES, normalizeSystemRole } from "../constants/roles.js";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getDateKey = (date = new Date()) => date.toISOString().split("T")[0];

const buildDutyMap = (duties) => {
  const map = new Map();
  duties.forEach((duty) => {
    const existing = map.get(String(duty.userId));
    if (!existing) {
      map.set(String(duty.userId), duty);
      return;
    }
    // Always prefer active on-duty records.
    if (duty.status === "onDuty" && existing.status !== "onDuty") {
      map.set(String(duty.userId), duty);
      return;
    }
    if (new Date(duty.createdAt) > new Date(existing.createdAt)) {
      map.set(String(duty.userId), duty);
    }
  });
  return map;
};

const buildShiftMap = (shifts) => {
  const map = new Map();
  shifts.forEach((shift) => {
    const key = String(shift.userId);
    const existing = map.get(key);
    if (!existing || new Date(shift.startTime) < new Date(existing.startTime)) {
      map.set(key, shift);
    }
  });
  return map;
};

const buildDepartmentMaps = async (users) => {
  const roleBuckets = users.reduce(
    (acc, user) => {
      const role = normalizeSystemRole(user.role);
      if (!acc[role]) acc[role] = [];
      acc[role].push(user._id);
      return acc;
    },
    {}
  );

  const [doctors, nurses, labTechs, receptionists, pharmacists] = await Promise.all([
    roleBuckets.doctor?.length
      ? Doctor.find({ userId: { $in: roleBuckets.doctor } }).populate("departmentId", "name")
      : [],
    roleBuckets.nurse?.length
      ? Nurse.find({ userId: { $in: roleBuckets.nurse } }).populate("departmentId", "name")
      : [],
    roleBuckets.labTechnician?.length
      ? LabTechnician.find({ userId: { $in: roleBuckets.labTechnician } }).populate("departmentId", "name")
      : [],
    roleBuckets.receptionist?.length
      ? Receptionist.find({ user: { $in: roleBuckets.receptionist } }).populate("department", "name")
      : [],
    roleBuckets.pharmacist?.length
      ? Pharmacist.find({ userId: { $in: roleBuckets.pharmacist } })
      : [],
  ]);

  const doctorMap = new Map(
    doctors.map((doc) => [String(doc.userId), doc.departmentId?.name || null])
  );
  const nurseMap = new Map(
    nurses.map((nurse) => [String(nurse.userId), nurse.departmentId?.name || null])
  );
  const labTechMap = new Map(
    labTechs.map((tech) => [String(tech.userId), tech.departmentId?.name || null])
  );
  const receptionistMap = new Map(
    receptionists.map((rec) => [String(rec.user), rec.department?.name || null])
  );
  const pharmacistMap = new Map(
    pharmacists.map((pharm) => [String(pharm.userId), null])
  );

  return { doctorMap, nurseMap, labTechMap, receptionistMap, pharmacistMap };
};

const resolveDepartment = (user, maps) => {
  const role = normalizeSystemRole(user.role);
  if (role === "doctor") return maps.doctorMap.get(String(user._id)) || null;
  if (role === "nurse") return maps.nurseMap.get(String(user._id)) || null;
  if (role === "labTechnician") return maps.labTechMap.get(String(user._id)) || null;
  if (role === "receptionist") return maps.receptionistMap.get(String(user._id)) || null;
  if (role === "pharmacist") return maps.pharmacistMap.get(String(user._id)) || null;
  return null;
};

const resolveStatus = ({ duty, shift }) => {
  if (duty?.status === "onDuty") return "Available";
  if (duty?.status === "offDuty") return "Off Duty";
  if (duty?.status === "leave" || duty?.status === "holiday") return "On Leave";
  if (shift) return "Scheduled";
  return "Off Duty";
};

export const getStaffAvailability = async (req, res) => {
  try {
    const todayKey = getDateKey();
    const { start, end } = getTodayRange();

    const staffFilter = {
      $or: [
        { role: { $in: EMPLOYEE_ROLES }, isActive: true },
        { _id: req.user.id },
      ],
    };

    const [users, duties, shifts] = await Promise.all([
      User.find(staffFilter)
        .select("name role email employeeId"),
      StaffDuty.find({
        $or: [
          { date: todayKey },
          { status: "onDuty" },
        ],
      }),
      ShiftSchedule.find({
        $or: [
          { date: todayKey },
          { startTime: { $lte: end }, endTime: { $gte: start } },
        ],
      }).populate("userId", "name role email employeeId"),
    ]);

    const dutyMap = buildDutyMap(duties);
    const shiftMap = buildShiftMap(shifts);
    const departmentMaps = await buildDepartmentMaps(users);

    const data = users.map((user) => {
      const duty = dutyMap.get(String(user._id));
      const shift = shiftMap.get(String(user._id));
      const status = resolveStatus({ duty, shift });

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: normalizeSystemRole(user.role),
        department:
          resolveDepartment(user, departmentMaps)
          || (normalizeSystemRole(user.role) === "pharmacist" ? "Pharmacy" : null),
        status,
        shiftType: shift?.shiftType || null,
        shiftStart: shift?.startTime || duty?.startTime || null,
        shiftEnd: shift?.endTime || duty?.endTime || null,
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStaffAvailabilitySummary = async (req, res) => {
  try {
    const todayKey = getDateKey();
    const { start, end } = getTodayRange();

    const staffFilter = {
      $or: [
        { role: { $in: EMPLOYEE_ROLES }, isActive: true },
        { _id: req.user.id },
      ],
    };

    const [users, duties, shifts] = await Promise.all([
      User.find(staffFilter).select("_id"),
      StaffDuty.find({
        $or: [
          { date: todayKey },
          { status: "onDuty" },
        ],
      }),
      ShiftSchedule.find({
        $or: [
          { date: todayKey },
          { startTime: { $lte: end }, endTime: { $gte: start } },
        ],
      }).select("userId"),
    ]);

    const dutyMap = buildDutyMap(duties);
    const shiftMap = buildShiftMap(shifts);

    const summary = {
      totalStaff: users.length,
      available: 0,
      offDuty: 0,
      onLeave: 0,
      scheduled: 0,
    };

    users.forEach((user) => {
      const duty = dutyMap.get(String(user._id));
      const shift = shiftMap.get(String(user._id));
      const status = resolveStatus({ duty, shift });

      if (status === "Available") summary.available += 1;
      else if (status === "Off Duty") summary.offDuty += 1;
      else if (status === "On Leave") summary.onLeave += 1;
      else if (status === "Scheduled") summary.scheduled += 1;
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
