import Bed from "../models/Bed.js";
import HandoverNote from "../models/HandoverNote.js";
import LabOrder from "../models/LabOrder.js";
import Nurse from "../models/Nurse.js";
import NurseAssignment from "../models/NurseAssignment.js";
import NursingNote from "../models/NursingNote.js";
import NursingTask from "../models/NursingTask.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import Shift from "../models/Shift.js";
import Vitals from "../models/Vitals.js";
import Ward from "../models/Ward.js";

const ACTIVE_ASSIGNMENT_STATUSES = ["scheduled", "active"];
const ESCALATION_NOTE_TYPE = "incident";

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const asOptionalObjectId = (value) => (value ? value : undefined);
const asOptionalDate = (value) => (value ? value : undefined);
const asOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const getAssignmentFilter = (nurseUserId) => ({
  nurseUserId,
  status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
  $or: [{ assignmentEnd: { $exists: false } }, { assignmentEnd: null }, { assignmentEnd: { $gte: new Date() } }],
});

const assignmentPopulate = [
  { path: "wardId", select: "name wardNumber wardType floor block bedCount" },
  { path: "shiftId", select: "name shiftType startTime endTime isActive" },
  { path: "patientId", populate: { path: "userId", select: "name email phone patientId gender dob" } },
  { path: "patientUserId", select: "name email phone patientId gender dob" },
];

const patientSummaryMap = ({
  patient,
  assignment,
  bed,
  doctor,
  prescriptions,
  labOrders,
  latestVitals,
}) => {
  const user = patient?.userId;
  const activePrescription = prescriptions?.[0] || null;
  const pendingLabOrders = (labOrders || []).filter((order) => !["completed", "cancelled"].includes(order.status));
  const diagnosisSummary = activePrescription?.diagnosis || activePrescription?.clinicalNotes || patient?.notes || "";

  return {
    id: patient._id,
    patientId: user?.patientId,
    name: user?.name,
    age: patient.age || calculateAge(patient.dateOfBirth || user?.dob),
    gender: patient.gender || user?.gender || "unknown",
    ward: assignment?.wardId
      ? {
          id: assignment.wardId._id,
          name: assignment.wardId.name,
          wardNumber: assignment.wardId.wardNumber,
          wardType: assignment.wardId.wardType,
        }
      : bed?.wardId
        ? {
            id: bed.wardId._id,
            name: bed.wardId.name,
            wardNumber: bed.wardId.wardNumber,
            wardType: bed.wardId.wardType,
          }
        : null,
    bed: bed
      ? {
          id: bed._id,
          bedNumber: bed.bedNumber,
          status: bed.status,
        }
      : null,
    assignedDoctor: doctor
      ? {
          id: doctor._id,
          name: doctor.userId?.name,
          email: doctor.userId?.email,
        }
      : null,
    diagnosisSummary,
    allergies: patient.allergies || [],
    chronicDiseases: patient.chronicDiseases || [],
    medicationSummary: (activePrescription?.medicines || []).map((medicine) => ({
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
      instructions: medicine.instructions,
    })),
    activePrescription: activePrescription
      ? {
          id: activePrescription._id,
          diagnosis: activePrescription.diagnosis,
          advice: activePrescription.advice,
          admissionRecommended: activePrescription.admissionRecommended,
          admissionRecommendationNotes: activePrescription.admissionRecommendationNotes,
          followUpDate: activePrescription.followUpDate,
        }
      : null,
    pendingLabOrders: pendingLabOrders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      urgency: order.urgency,
      tests: order.items?.map((item) => item.testName) || [],
    })),
    latestVitals: latestVitals
      ? {
          recordedAt: latestVitals.recordedAt,
          bloodPressure: latestVitals.systolicBp && latestVitals.diastolicBp
            ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}`
            : null,
          pulse: latestVitals.pulse,
          temperature: latestVitals.temperature,
          spo2: latestVitals.spo2,
          respirationRate: latestVitals.respirationRate,
          bloodSugar: latestVitals.bloodSugar,
          weight: latestVitals.weight,
          notes: latestVitals.notes,
        }
      : null,
  };
};

const mapTask = (task) => ({
  id: task._id,
  taskType: task.taskType,
  status: task.status,
  dueAt: task.dueAt,
  completedAt: task.completedAt,
  notes: task.notes,
  patient: task.patientId
    ? {
        id: task.patientId._id,
        name: task.patientId.userId?.name,
        patientId: task.patientId.userId?.patientId,
      }
    : null,
  ward: task.wardId
    ? {
        id: task.wardId._id,
        name: task.wardId.name,
        wardNumber: task.wardId.wardNumber,
      }
    : null,
});

const mapVitals = (entry) => ({
  id: entry._id,
  patientId: entry.patientId?._id || entry.patientId,
  patientName: entry.patientId?.userId?.name,
  nurseName: entry.nurseUserId?.name,
  temperature: entry.temperature,
  pulse: entry.pulse,
  respirationRate: entry.respirationRate,
  systolicBp: entry.systolicBp,
  diastolicBp: entry.diastolicBp,
  spo2: entry.spo2,
  bloodSugar: entry.bloodSugar,
  weight: entry.weight,
  notes: entry.notes,
  recordedAt: entry.recordedAt,
  createdAt: entry.createdAt,
});

const mapNursingNote = (note) => ({
  id: note._id,
  noteType: note.noteType,
  content: note.content,
  createdAt: note.createdAt,
  patient: note.patientId
    ? {
        id: note.patientId._id,
        name: note.patientId.userId?.name,
        patientId: note.patientId.userId?.patientId,
      }
    : null,
  nurse: note.nurseUserId
    ? {
        id: note.nurseUserId._id,
        name: note.nurseUserId.name,
      }
    : null,
});

const mapHandover = (note) => ({
  id: note._id,
  priority: note.priority,
  summary: note.summary,
  createdAt: note.createdAt,
  ward: note.wardId
    ? {
        id: note.wardId._id,
        name: note.wardId.name,
        wardNumber: note.wardId.wardNumber,
      }
    : null,
  patient: note.patientId
    ? {
        id: note.patientId._id,
        name: note.patientId.userId?.name,
        patientId: note.patientId.userId?.patientId,
      }
    : null,
  fromNurse: note.fromNurseUserId
    ? {
        id: note.fromNurseUserId._id,
        name: note.fromNurseUserId.name,
      }
    : null,
  toNurse: note.toNurseUserId
    ? {
        id: note.toNurseUserId._id,
        name: note.toNurseUserId.name,
      }
    : null,
});

const getScopeData = async (nurseUserId) => {
  const assignments = await NurseAssignment.find(getAssignmentFilter(nurseUserId))
    .populate(assignmentPopulate)
    .sort({ assignmentStart: 1 });

  const patientIds = [...new Set(assignments.map((assignment) => assignment.patientId?._id?.toString()).filter(Boolean))];
  const wardIds = [...new Set(assignments.map((assignment) => assignment.wardId?._id?.toString()).filter(Boolean))];
  const shiftIds = [...new Set(assignments.map((assignment) => assignment.shiftId?._id?.toString()).filter(Boolean))];

  const [patients, beds, prescriptions, labOrders, vitalsEntries, wards, shifts] = await Promise.all([
    patientIds.length
      ? Patient.find({ _id: { $in: patientIds } }).populate("userId", "name email phone patientId gender dob")
      : [],
    patientIds.length
      ? Bed.find({ patientProfileId: { $in: patientIds } }).populate("wardId", "name wardNumber wardType")
      : [],
    patientIds.length
      ? Prescription.find({ patientId: { $in: patientIds }, status: { $ne: "cancelled" } })
          .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
          .sort({ createdAt: -1 })
      : [],
    patientIds.length
      ? LabOrder.find({ patientId: { $in: patientIds } }).sort({ createdAt: -1 })
      : [],
    patientIds.length
      ? Vitals.find({ patientId: { $in: patientIds } })
          .populate("nurseUserId", "name")
          .sort({ recordedAt: -1 })
      : [],
    wardIds.length ? Ward.find({ _id: { $in: wardIds } }) : [],
    shiftIds.length ? Shift.find({ _id: { $in: shiftIds } }) : [],
  ]);

  const patientMap = new Map(patients.map((patient) => [String(patient._id), patient]));
  const bedMap = new Map(beds.map((bed) => [String(bed.patientProfileId), bed]));
  const prescriptionsByPatient = prescriptions.reduce((acc, prescription) => {
    const key = String(prescription.patientId);
    acc[key] = acc[key] || [];
    acc[key].push(prescription);
    return acc;
  }, {});
  const labOrdersByPatient = labOrders.reduce((acc, order) => {
    const key = String(order.patientId);
    acc[key] = acc[key] || [];
    acc[key].push(order);
    return acc;
  }, {});
  const latestVitalsByPatient = new Map();
  vitalsEntries.forEach((entry) => {
    const key = String(entry.patientId);
    if (!latestVitalsByPatient.has(key)) {
      latestVitalsByPatient.set(key, entry);
    }
  });
  const wardMap = new Map(wards.map((ward) => [String(ward._id), ward]));
  const shiftMap = new Map(shifts.map((shift) => [String(shift._id), shift]));

  const patientSummaries = assignments
    .filter((assignment) => assignment.patientId)
    .map((assignment) => {
      const patient = patientMap.get(String(assignment.patientId._id));
      const doctor = prescriptionsByPatient[String(patient?._id)]?.[0]?.doctorId || null;
      return patient
        ? patientSummaryMap({
            patient,
            assignment,
            bed: bedMap.get(String(patient._id)),
            doctor,
            prescriptions: prescriptionsByPatient[String(patient._id)] || [],
            labOrders: labOrdersByPatient[String(patient._id)] || [],
            latestVitals: latestVitalsByPatient.get(String(patient._id)),
          })
        : null;
    })
    .filter(Boolean);

  return {
    assignments,
    patientSummaries,
    wardMap,
    shiftMap,
    latestVitalsByPatient,
    patientIds,
    wardIds,
  };
};

export const getMyProfile = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user.id })
      .populate("userId", "name email phone gender profileImage employeeId")
      .populate("departmentId", "name")
      .populate({
        path: "assignedDoctors",
        populate: { path: "userId", select: "name email" },
      });

    if (!nurse) return res.status(404).json({ message: "Nurse profile not found." });
    res.json(nurse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { assignedWard, shift, specialization } = req.body;
    let nurse = await Nurse.findOne({ userId: req.user.id });
    if (!nurse) {
      nurse = await Nurse.create({ userId: req.user.id, ...req.body });
    } else {
      if (assignedWard !== undefined) nurse.assignedWard = assignedWard;
      if (shift !== undefined) nurse.shift = shift;
      if (specialization !== undefined) nurse.specialization = specialization;
      await nurse.save();
    }
    res.json({ message: "Profile updated.", nurse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user.id });
    const scope = await getScopeData(req.user.id);
    const patientIds = scope.patientIds;
    const wardIds = scope.wardIds;
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [pendingTasks, urgentEscalations, recentVitals, vitalsDueCount, currentShiftAssignments] = await Promise.all([
      NursingTask.countDocuments({
        $or: [
          { nurseUserId: req.user.id },
          { patientId: { $in: patientIds } },
          { wardId: { $in: wardIds } },
        ],
        status: { $in: ["pending", "inProgress"] },
      }),
      NursingNote.countDocuments({
        nurseUserId: req.user.id,
        noteType: ESCALATION_NOTE_TYPE,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      patientIds.length
        ? Vitals.find({ patientId: { $in: patientIds } })
            .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
            .sort({ recordedAt: -1 })
            .limit(5)
        : [],
      patientIds.filter((patientId) => {
        const latest = scope.latestVitalsByPatient.get(String(patientId));
        if (!latest) return true;
        return new Date(latest.recordedAt).getTime() < Date.now() - 6 * 60 * 60 * 1000;
      }).length,
      NurseAssignment.find({
        nurseUserId: req.user.id,
        status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
      }).populate("shiftId", "name startTime endTime shiftType"),
    ]);

    const currentAssignment = scope.assignments.find((assignment) => assignment.status === "active") || scope.assignments[0] || null;
    const currentWard = currentAssignment?.wardId || null;
    const currentShift = currentAssignment?.shiftId || currentShiftAssignments[0]?.shiftId || null;

    res.json({
      assignedWard: currentWard
        ? {
            id: currentWard._id,
            name: currentWard.name,
            wardNumber: currentWard.wardNumber,
            wardType: currentWard.wardType,
          }
        : nurse?.assignedWard || null,
      currentShift: currentShift
        ? {
            id: currentShift._id,
            name: currentShift.name,
            startTime: currentShift.startTime,
            endTime: currentShift.endTime,
            shiftType: currentShift.shiftType,
          }
        : nurse?.shift || null,
      assignedPatientsCount: scope.patientSummaries.length,
      pendingTasks,
      vitalsDueCount,
      urgentEscalations,
      recentVitals: recentVitals.map(mapVitals),
      quickActions: [
        { label: "Open Assigned Patients", path: "/employee/nurse/patients" },
        { label: "Record Vitals", path: "/employee/nurse/vitals" },
        { label: "View Tasks", path: "/employee/nurse/tasks" },
        { label: "Add Nursing Note", path: "/employee/nurse/notes" },
        { label: "Open Handover", path: "/employee/nurse/handover" },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const assignments = await NurseAssignment.find({ nurseUserId: req.user.id })
      .populate(assignmentPopulate)
      .sort({ assignmentStart: 1 });

    res.json(
      assignments.map((assignment) => ({
        id: assignment._id,
        status: assignment.status,
        assignmentStart: assignment.assignmentStart,
        assignmentEnd: assignment.assignmentEnd,
        ward: assignment.wardId,
        shift: assignment.shiftId,
        patient: assignment.patientId
          ? {
              id: assignment.patientId._id,
              name: assignment.patientId.userId?.name,
              patientId: assignment.patientId.userId?.patientId,
            }
          : null,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignedPatients = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    res.json(scope.patientSummaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWardOverview = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const wardIds = scope.wardIds;
    const beds = wardIds.length
      ? await Bed.find({ wardId: { $in: wardIds } })
          .populate("wardId", "name wardNumber wardType")
          .populate("patientProfileId")
          .populate("patientId", "name patientId")
          .sort({ ward: 1, bedNumber: 1 })
      : [];

    const wardGroups = [...scope.wardMap.values()].map((ward) => {
      const wardBeds = beds.filter((bed) => String(bed.wardId?._id) === String(ward._id));
      return {
        id: ward._id,
        name: ward.name,
        wardNumber: ward.wardNumber,
        wardType: ward.wardType,
        floor: ward.floor,
        block: ward.block,
        bedCount: ward.bedCount,
        occupancy: wardBeds.filter((bed) => bed.status === "occupied").length,
        patients: scope.patientSummaries.filter(
          (patient) => patient.ward?.id && String(patient.ward.id) === String(ward._id)
        ),
        beds: wardBeds.map((bed) => ({
          id: bed._id,
          bedNumber: bed.bedNumber,
          status: bed.status,
          patientName: bed.patientId?.name || bed.patientProfileId?.userId?.name || null,
          patientId: bed.patientId?.patientId || bed.patientProfileId?.userId?.patientId || null,
        })),
      };
    });

    res.json({
      wards: wardGroups,
      totalPatients: scope.patientSummaries.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNursingTasks = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const { status, patientId, type } = req.query;
    const filter = {
      $or: [
        { nurseUserId: req.user.id },
        { patientId: { $in: scope.patientIds } },
        { wardId: { $in: scope.wardIds } },
      ],
    };

    if (status) filter.status = status;
    if (patientId) filter.patientId = patientId;
    if (type) filter.taskType = type;

    const tasks = await NursingTask.find(filter)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("wardId", "name wardNumber")
      .sort({ dueAt: 1, createdAt: -1 });

    res.json(tasks.map(mapTask));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createNursingTask = async (req, res) => {
  try {
    const patientId = asOptionalObjectId(req.body.patientId);
    const wardId = asOptionalObjectId(req.body.wardId);
    const dueAt = asOptionalDate(req.body.dueAt);
    const { taskType, notes } = req.body;
    const scope = await getScopeData(req.user.id);
    const inScopePatient = !patientId || scope.patientIds.includes(String(patientId));
    const inScopeWard = !wardId || scope.wardIds.includes(String(wardId));

    if (!taskType) {
      return res.status(400).json({ message: "Task type is required." });
    }

    if (!inScopePatient || !inScopeWard) {
      return res.status(403).json({ message: "You can only create tasks for your assigned scope." });
    }

    const patient = patientId ? await Patient.findById(patientId).populate("userId", "patientId") : null;
    const task = await NursingTask.create({
      patientId,
      patientUserId: patient?.userId?._id,
      nurseUserId: req.user.id,
      wardId,
      taskType,
      dueAt,
      notes,
      status: "pending",
    });

    const populatedTask = await NursingTask.findById(task._id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("wardId", "name wardNumber");

    res.status(201).json({
      message: "Nursing task created.",
      task: mapTask(populatedTask),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNursingTask = async (req, res) => {
  try {
    const task = await NursingTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const scope = await getScopeData(req.user.id);
    const inScope =
      String(task.nurseUserId) === String(req.user.id) ||
      (task.patientId && scope.patientIds.includes(String(task.patientId))) ||
      (task.wardId && scope.wardIds.includes(String(task.wardId)));

    if (!inScope) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.notes !== undefined) task.notes = req.body.notes;
    if (req.body.dueAt !== undefined) task.dueAt = req.body.dueAt || null;
    if (task.status === "completed") {
      task.completedAt = new Date();
    }
    await task.save();

    const populatedTask = await NursingTask.findById(task._id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("wardId", "name wardNumber");

    res.json({
      message: "Task updated.",
      task: mapTask(populatedTask),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recordVitals = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const patientId = asOptionalObjectId(req.body.patientId);

    if (!patientId || !scope.patientIds.includes(String(patientId))) {
      return res.status(403).json({ message: "You can only record vitals for assigned patients." });
    }

    const patient = await Patient.findById(patientId).populate("userId", "name patientId");
    const entry = await Vitals.create({
      patientId,
      patientUserId: patient?.userId?._id,
      nurseUserId: req.user.id,
      temperature: asOptionalNumber(req.body.temperature),
      pulse: asOptionalNumber(req.body.pulse),
      respirationRate: asOptionalNumber(req.body.respirationRate),
      systolicBp: asOptionalNumber(req.body.systolicBp),
      diastolicBp: asOptionalNumber(req.body.diastolicBp),
      spo2: asOptionalNumber(req.body.spo2),
      bloodSugar: asOptionalNumber(req.body.bloodSugar),
      weight: asOptionalNumber(req.body.weight),
      notes: req.body.notes,
      recordedAt: req.body.recordedAt || new Date(),
    });

    const populated = await Vitals.findById(entry._id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("nurseUserId", "name");

    res.status(201).json({
      message: "Vitals recorded successfully.",
      vitals: mapVitals(populated),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVitalsHistory = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const patientId = req.query.patientId || req.params.patientId;
    const filter = patientId
      ? { patientId }
      : { patientId: { $in: scope.patientIds } };

    if (patientId && !scope.patientIds.includes(String(patientId))) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    const entries = await Vitals.find(filter)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("nurseUserId", "name")
      .sort({ recordedAt: -1 })
      .limit(50);

    res.json(entries.map(mapVitals));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createNursingNote = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const { patientId, noteType, content } = req.body;

    if (!patientId || !content) {
      return res.status(400).json({ message: "Patient and content are required." });
    }

    if (!scope.patientIds.includes(String(patientId))) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    const patient = await Patient.findById(patientId).populate("userId", "name patientId");
    const note = await NursingNote.create({
      patientId,
      patientUserId: patient?.userId?._id,
      nurseUserId: req.user.id,
      noteType,
      content,
    });

    const populated = await NursingNote.findById(note._id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("nurseUserId", "name");

    res.status(201).json({
      message: "Nursing note created.",
      note: mapNursingNote(populated),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNursingNotes = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const { patientId, noteType } = req.query;
    const filter = {
      patientId: { $in: scope.patientIds },
    };
    if (patientId) {
      if (!scope.patientIds.includes(String(patientId))) {
        return res.status(403).json({ message: "Access forbidden." });
      }
      filter.patientId = patientId;
    }
    if (noteType) filter.noteType = noteType;

    const notes = await NursingNote.find(filter)
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("nurseUserId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notes.map(mapNursingNote));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHandoverNote = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const wardId = asOptionalObjectId(req.body.wardId);
    const patientId = asOptionalObjectId(req.body.patientId);
    const toNurseUserId = asOptionalObjectId(req.body.toNurseUserId);
    const { priority, summary } = req.body;

    if (!summary) {
      return res.status(400).json({ message: "Handover summary is required." });
    }

    if (wardId && !scope.wardIds.includes(String(wardId))) {
      return res.status(403).json({ message: "Access forbidden for this ward." });
    }
    if (patientId && !scope.patientIds.includes(String(patientId))) {
      return res.status(403).json({ message: "Access forbidden for this patient." });
    }

    const patient = patientId ? await Patient.findById(patientId).populate("userId", "name patientId") : null;
    const note = await HandoverNote.create({
      fromNurseUserId: req.user.id,
      toNurseUserId: toNurseUserId || undefined,
      wardId,
      patientId,
      patientUserId: patient?.userId?._id,
      priority,
      summary,
    });

    const populated = await HandoverNote.findById(note._id)
      .populate("wardId", "name wardNumber")
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("fromNurseUserId", "name")
      .populate("toNurseUserId", "name");

    res.status(201).json({
      message: "Handover note created.",
      note: mapHandover(populated),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHandoverNotes = async (req, res) => {
  try {
    const scope = await getScopeData(req.user.id);
    const { wardId, patientId } = req.query;
    const filter = {
      $or: [
        { fromNurseUserId: req.user.id },
        { toNurseUserId: req.user.id },
        { wardId: { $in: scope.wardIds } },
        { patientId: { $in: scope.patientIds } },
      ],
    };
    if (wardId) filter.wardId = wardId;
    if (patientId) filter.patientId = patientId;

    const notes = await HandoverNote.find(filter)
      .populate("wardId", "name wardNumber")
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
      .populate("fromNurseUserId", "name")
      .populate("toNurseUserId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notes.map(mapHandover));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEscalationNote = async (req, res) => {
  req.body.noteType = ESCALATION_NOTE_TYPE;
  return createNursingNote(req, res);
};

export const getEscalationNotes = async (req, res) => {
  req.query.noteType = ESCALATION_NOTE_TYPE;
  return getNursingNotes(req, res);
};
