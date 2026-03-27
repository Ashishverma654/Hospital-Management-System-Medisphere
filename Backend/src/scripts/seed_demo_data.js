import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Department from "../models/Department.js";
import Specialization from "../models/Specialization.js";
import HospitalLocation from "../models/HospitalLocation.js";
import HospitalSettings from "../models/HospitalSettings.js";
import Doctor from "../models/Doctor.js";
import Nurse from "../models/Nurse.js";
import Receptionist from "../models/Receptionist.js";
import Pharmacist from "../models/Pharmacist.js";
import LabTechnician from "../models/LabTechnician.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import LabTest from "../models/LabTest.js";
import TestPrice from "../models/TestPrice.js";
import LabOrder from "../models/LabOrder.js";
import LabOrderItem from "../models/LabOrderItem.js";
import LabReport from "../models/LabReport.js";
import Medicine from "../models/Medicine.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import Invoice from "../models/Invoice.js";
import Ward from "../models/Ward.js";
import Bed from "../models/Bed.js";
import Shift from "../models/Shift.js";
import ShiftSchedule from "../models/ShiftSchedule.js";
import StaffDuty from "../models/StaffDuty.js";
import AuditLog from "../models/AuditLog.js";
import CreationLog from "../models/CreationLog.js";
import Notification from "../models/Notification.js";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required.");
  process.exit(1);
}

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const randomDateWithinDays = (days = 60) =>
  new Date(Date.now() - randomInt(0, days) * 24 * 60 * 60 * 1000 - randomInt(0, 8) * 60 * 60 * 1000);

const backdate = async (Model, id, date) => {
  await Model.updateOne(
    { _id: id },
    { $set: { createdAt: date, updatedAt: date } },
    { timestamps: false }
  );
};

const hashPassword = async (password) => bcrypt.hash(password, 10);
const toEmailSafe = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

const createUser = async ({
  name,
  email,
  role,
  phone,
  password = "Password@123",
  pin = "1234",
  createdBy,
  employeeId,
  patientId,
}) => {
  const user = await User.create({
    name,
    email,
    role,
    phone,
    password: await hashPassword(password),
    pin: await hashPassword(pin),
    createdBy,
    employeeId,
    patientId,
  });
  return user;
};

const createCreationLog = async (creator, created, createdAt) => {
  const log = await CreationLog.create({
    creatorId: creator._id,
    creatorName: creator.name,
    creatorRole: creator.role,
    createdUserId: created._id,
    createdUserName: created.name,
    createdUserEmail: created.email,
    createdUserRole: created.role,
    action: "created",
  });
  if (createdAt) {
    await backdate(CreationLog, log._id, createdAt);
  }
  return log;
};

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const now = new Date();
  const lastTwoMonths = 60;

  const dropCollection = async (model) => {
    try {
      await model.collection.drop();
    } catch (err) {
      if (err?.codeName === "NamespaceNotFound") return;
      if (String(err?.message || "").includes("ns not found")) return;
      throw err;
    }
  };

  // Clean existing data (drop collections to clear legacy indexes)
  await Promise.all([
    dropCollection(User),
    dropCollection(Department),
    dropCollection(Specialization),
    dropCollection(HospitalLocation),
    dropCollection(HospitalSettings),
    dropCollection(Doctor),
    dropCollection(Nurse),
    dropCollection(Receptionist),
    dropCollection(Pharmacist),
    dropCollection(LabTechnician),
    dropCollection(Patient),
    dropCollection(Appointment),
    dropCollection(Prescription),
    dropCollection(LabTest),
    dropCollection(TestPrice),
    dropCollection(LabOrder),
    dropCollection(LabOrderItem),
    dropCollection(LabReport),
    dropCollection(Medicine),
    dropCollection(PharmacyOrder),
    dropCollection(Invoice),
    dropCollection(Ward),
    dropCollection(Bed),
    dropCollection(Shift),
    dropCollection(ShiftSchedule),
    dropCollection(StaffDuty),
    dropCollection(AuditLog),
    dropCollection(CreationLog),
    dropCollection(Notification),
  ]);

  // Superadmin
  let superadmin = await User.findOne({ role: "superadmin" });
  if (!superadmin) {
    superadmin = await createUser({
      name: "Super Admin",
      email: "superadmin@mediflow.org",
      role: "superadmin",
      phone: "9000000001",
      password: "SuperAdmin@123",
      employeeId: "SA-0001",
    });
    await backdate(User, superadmin._id, randomDateWithinDays(lastTwoMonths));
  }

  // Admins
  const adminNames = ["Ashish Verma", "Rohit Malhotra"];
  const admins = [];
  for (let i = 1; i <= 2; i += 1) {
    const name = adminNames[i - 1];
    const admin = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "admin",
      phone: `900000010${i}`,
      createdBy: superadmin._id,
      employeeId: `ADM-00${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, admin._id, createdAt);
    await createCreationLog(superadmin, admin, createdAt);
    admins.push(admin);
  }

  // Subadmins
  const subadminNames = ["Rani Laxmi", "Kabir Sethi"];
  const subadmins = [];
  for (let i = 1; i <= 2; i += 1) {
    const creator = admins[i % admins.length];
    const name = subadminNames[i - 1];
    const subadmin = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "subadmin",
      phone: `900000020${i}`,
      createdBy: creator._id,
      employeeId: `SUB-00${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, subadmin._id, createdAt);
    await createCreationLog(creator, subadmin, createdAt);
    subadmins.push(subadmin);
  }

  // Hospital settings
  await HospitalSettings.deleteMany({});
  await HospitalSettings.create({
    hospitalName: "MediFlow Hospital",
    email: "info@mediflow.care",
    phone: "9247 422727, 9550 422727",
    address: "Ambedkar Road, City Center",
    logo: "",
    footerInfo: "MediFlow Healthcare",
    publicInfo: "24x7 Emergency • Advanced Diagnostics",
    updatedBy: superadmin._id,
    isActive: true,
  });

  // Locations
  const locations = await HospitalLocation.insertMany([
    {
      name: "MediFlow Central Hospital",
      address: "Ambedkar Road, City Center",
      city: "Karimnagar",
      state: "Telangana",
      pincode: "505001",
      phone: "9550422727",
      email: "central@mediflow.care",
      locationType: "hospital",
      createdBy: superadmin._id,
    },
    {
      name: "MediFlow East Clinic",
      address: "Lakeview Avenue",
      city: "Karimnagar",
      state: "Telangana",
      pincode: "505002",
      phone: "9550422728",
      email: "east@mediflow.care",
      locationType: "clinic",
      createdBy: admins[0]._id,
    },
  ]);

  // Departments & specializations
  const departments = await Department.insertMany([
    { name: "Cardiology", code: "CARD", description: "Heart care", createdBy: superadmin._id },
    { name: "Orthopedics", code: "ORTHO", description: "Bones & joints", createdBy: admins[0]._id },
    { name: "Neurology", code: "NEURO", description: "Brain & nerves", createdBy: admins[1]._id },
    { name: "General Medicine", code: "GEN", description: "General care", createdBy: subadmins[0]._id },
  ]);

  const specializations = await Specialization.insertMany([
    { name: "Interventional Cardiology", departmentId: departments[0]._id, createdBy: superadmin._id },
    { name: "Joint Replacement", departmentId: departments[1]._id, createdBy: admins[0]._id },
    { name: "Neuro Surgery", departmentId: departments[2]._id, createdBy: admins[1]._id },
    { name: "Internal Medicine", departmentId: departments[3]._id, createdBy: subadmins[0]._id },
  ]);

  // Wards
  const wards = await Ward.insertMany([
    {
      name: "ICU Ward",
      wardNumber: "ICU-1",
      wardType: "icu",
      bedCount: 8,
      defaultPrice: 4000,
      departmentId: departments[0]._id,
      hospitalLocationId: locations[0]._id,
      createdBy: superadmin._id,
    },
    {
      name: "General Ward A",
      wardNumber: "GW-A",
      wardType: "general",
      bedCount: 12,
      defaultPrice: 1500,
      departmentId: departments[3]._id,
      hospitalLocationId: locations[0]._id,
      createdBy: admins[0]._id,
    },
    {
      name: "Recovery Ward",
      wardNumber: "RW-1",
      wardType: "semi-private",
      bedCount: 10,
      defaultPrice: 2500,
      departmentId: departments[1]._id,
      hospitalLocationId: locations[0]._id,
      createdBy: subadmins[0]._id,
    },
  ]);

  // Beds
  const beds = [];
  wards.forEach((ward, idx) => {
    for (let i = 1; i <= ward.bedCount; i += 1) {
      beds.push({
        bedNumber: `${ward.wardNumber}-${i}`,
        ward: ward.name,
        wardId: ward._id,
        type: ward.wardType,
        status: "available",
      });
    }
  });
  const bedDocs = await Bed.insertMany(beds);

  // Shift templates
  const shiftTemplates = await Shift.insertMany([
    { name: "Morning Shift", shiftType: "morning", startTime: "06:00", endTime: "14:00", createdBy: superadmin._id },
    { name: "Evening Shift", shiftType: "evening", startTime: "14:00", endTime: "22:00", createdBy: admins[0]._id },
    { name: "Night Shift", shiftType: "night", startTime: "22:00", endTime: "06:00", createdBy: admins[1]._id },
  ]);

  // Staff users
  const doctors = [];
  const nurses = [];
  const receptionists = [];
  const pharmacists = [];
  const labTechs = [];

  const doctorNames = [
    "Vinesh Sharma",
    "Priya Iyer",
    "Raghav Menon",
    "Neha Kapoor",
    "Arjun Rao",
    "Sanjana Gupta",
  ];
  for (let i = 1; i <= 6; i += 1) {
    const creator = subadmins[i % subadmins.length];
    const name = doctorNames[i - 1];
    const user = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "doctor",
      phone: `90000010${i}0`,
      createdBy: creator._id,
      employeeId: `DOC-10${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, user._id, createdAt);
    await createCreationLog(creator, user, createdAt);
    const doctor = await Doctor.create({
      userId: user._id,
      departmentId: departments[i % departments.length]._id,
      specializationIds: [specializations[i % specializations.length]._id],
      experienceYears: randomInt(4, 18),
      consultationFee: randomInt(400, 900),
      consultationFeeVideo: randomInt(300, 700),
      consultationFeePhone: randomInt(200, 500),
      onboardingStatus: "active",
      isPublished: true,
      history: [
        {
          action: "created",
          performedBy: { id: creator._id, name: creator.name, role: creator.role },
          details: "Doctor profile created",
          timestamp: randomDateWithinDays(lastTwoMonths),
        },
      ],
    });
    await backdate(Doctor, doctor._id, createdAt);
    await AuditLog.create({
      actorId: creator._id,
      actorName: creator.name,
      actorRole: creator.role,
      action: "created",
      entityType: "Doctor",
      entityId: doctor._id,
      details: { note: "Doctor onboarded and published." },
      createdAt,
      updatedAt: createdAt,
    });
    doctors.push({ user, doctor });
  }

  const nurseNames = [
    "Priti Nair",
    "Akanksha Joshi",
    "Meera Das",
    "Ritu Sharma",
    "Kavya N",
    "Aditi Rao",
    "Sonia Bhat",
    "Naina Kapoor",
    "Anjali Menon",
    "Bhavna Singh",
  ];
  for (let i = 1; i <= 10; i += 1) {
    const creator = subadmins[(i + 1) % subadmins.length];
    const name = nurseNames[i - 1];
    const user = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "nurse",
      phone: `90000020${i}0`,
      createdBy: creator._id,
      employeeId: `NUR-20${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, user._id, createdAt);
    await createCreationLog(creator, user, createdAt);
    const nurse = await Nurse.create({
      userId: user._id,
      departmentId: departments[i % departments.length]._id,
      assignedWard: wards[i % wards.length].name,
      shift: pick(["morning", "afternoon", "night"]),
      experienceYears: randomInt(1, 10),
      joiningDate: createdAt,
      qualifications: ["GNM"],
      certifications: ["BLS"],
    });
    await backdate(Nurse, nurse._id, createdAt);
    await AuditLog.create({
      actorId: creator._id,
      actorName: creator.name,
      actorRole: creator.role,
      action: "created",
      entityType: "Nurse",
      entityId: nurse._id,
      details: { note: "Nurse profile created and assigned ward." },
      createdAt,
      updatedAt: createdAt,
    });
    nurses.push({ user, nurse });
  }

  const receptionistNames = ["Anita Laxmi", "Sunita Verma", "Akash Singh"];
  for (let i = 1; i <= 3; i += 1) {
    const creator = subadmins[i % subadmins.length];
    const name = receptionistNames[i - 1];
    const user = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "receptionist",
      phone: `90000030${i}0`,
      createdBy: creator._id,
      employeeId: `REC-30${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, user._id, createdAt);
    await createCreationLog(creator, user, createdAt);
    const receptionist = await Receptionist.create({
      user: user._id,
      employeeId: user.employeeId,
      department: departments[3]._id,
      shift: pick(["morning", "afternoon", "night"]),
      experienceYears: randomInt(2, 8),
      joiningDate: createdAt,
    });
    await backdate(Receptionist, receptionist._id, createdAt);
    await AuditLog.create({
      actorId: creator._id,
      actorName: creator.name,
      actorRole: creator.role,
      action: "created",
      entityType: "Receptionist",
      entityId: receptionist._id,
      details: { note: "Receptionist onboarded and assigned department." },
      createdAt,
      updatedAt: createdAt,
    });
    receptionists.push({ user, receptionist });
  }

  const pharmacistNames = ["Rohit Pandey", "Asha Kulkarni", "Nikhil Jain", "Priyanka Paul"];
  for (let i = 1; i <= 4; i += 1) {
    const creator = subadmins[i % subadmins.length];
    const name = pharmacistNames[i - 1];
    const user = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "pharmacist",
      phone: `90000040${i}0`,
      createdBy: creator._id,
      employeeId: `PHA-40${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, user._id, createdAt);
    await createCreationLog(creator, user, createdAt);
    const pharmacist = await Pharmacist.create({
      userId: user._id,
      licenseNumber: `PH-${randomInt(1000, 9999)}`,
      shift: pick(["morning", "afternoon", "night"]),
      experienceYears: randomInt(2, 12),
      joiningDate: createdAt,
      assignedCounter: `Counter-${randomInt(1, 3)}`,
      certifications: ["Pharmacy Council Registration"],
    });
    await backdate(Pharmacist, pharmacist._id, createdAt);
    await AuditLog.create({
      actorId: creator._id,
      actorName: creator.name,
      actorRole: creator.role,
      action: "created",
      entityType: "Pharmacist",
      entityId: pharmacist._id,
      details: { note: "Pharmacist onboarding completed." },
      createdAt,
      updatedAt: createdAt,
    });
    pharmacists.push({ user, pharmacist });
  }

  const labTechNames = [
    "Amit Kulkarni",
    "Shreya Bose",
    "Manish Reddy",
    "Pooja Nair",
    "Vikram Singh",
    "Divya Iyer",
  ];
  for (let i = 1; i <= 6; i += 1) {
    const creator = subadmins[i % subadmins.length];
    const name = labTechNames[i - 1];
    const user = await createUser({
      name,
      email: `${toEmailSafe(name)}@mediflow.org`,
      role: "labTechnician",
      phone: `90000050${i}0`,
      createdBy: creator._id,
      employeeId: `LAB-50${i}`,
    });
    const createdAt = randomDateWithinDays(lastTwoMonths);
    await backdate(User, user._id, createdAt);
    await createCreationLog(creator, user, createdAt);
    const tech = await LabTechnician.create({
      userId: user._id,
      departmentId: departments[i % departments.length]._id,
      labSection: pick(["Pathology", "Radiology", "Microbiology"]),
      experienceYears: randomInt(2, 10),
      joiningDate: createdAt,
      certifications: ["MLT Certified"],
    });
    await backdate(LabTechnician, tech._id, createdAt);
    await AuditLog.create({
      actorId: creator._id,
      actorName: creator.name,
      actorRole: creator.role,
      action: "created",
      entityType: "LabTechnician",
      entityId: tech._id,
      details: { note: "Lab technician added to lab section." },
      createdAt,
      updatedAt: createdAt,
    });
    labTechs.push({ user, tech });
  }

  // Patients
  const patients = [];
  const patientFirstNames = [
    "Arun",
    "Meera",
    "Rahul",
    "Anita",
    "Suresh",
    "Kiran",
    "Deepa",
    "Vikas",
    "Pallavi",
    "Nitin",
    "Sneha",
    "Prakash",
    "Isha",
    "Rohini",
    "Aman",
    "Karthik",
    "Riya",
    "Sahil",
    "Tanya",
    "Varun",
  ];
  const patientLastNames = [
    "Sharma",
    "Verma",
    "Gupta",
    "Nair",
    "Reddy",
    "Iyer",
    "Khan",
    "Patel",
    "Singh",
    "Joshi",
  ];
  for (let i = 1; i <= 30; i += 1) {
    const creator = receptionists[i % receptionists.length].user;
    const name = `${pick(patientFirstNames)} ${pick(patientLastNames)}`;
    const emailHandle = `${toEmailSafe(name)}.${i}`;
    const user = await createUser({
      name,
      email: `${emailHandle}@gmail.com`,
      role: "patient",
      phone: `80000060${i.toString().padStart(2, "0")}`,
      createdBy: creator._id,
      patientId: `PAT-${String(2000 + i)}`,
    });
    await createCreationLog(creator, user);
    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth: daysAgo(randomInt(7000, 20000)),
      bloodGroup: pick(["A+", "A-", "B+", "O+", "AB+"]),
      gender: pick(["male", "female"]),
      primaryDoctorId: doctors[i % doctors.length].doctor._id,
      hospitalLocationId: locations[i % locations.length]._id,
      createdBy: creator._id,
    });
    patients.push({ user, patient });
  }

  // Lab tests + prices
  const labTests = await LabTest.insertMany([
    { name: "Complete Blood Count", testType: "BLOOD", description: "CBC Panel" },
    { name: "Blood Sugar (Random)", testType: "BLOOD", description: "Glucose Test" },
    { name: "Lipid Profile", testType: "BLOOD", description: "Cholesterol Panel" },
    { name: "X-Ray Chest", testType: "RADIOLOGY", description: "Chest X-Ray" },
  ]);

  await TestPrice.insertMany(
    labTests.map((test, idx) => ({
      testId: test._id,
      price: randomInt(200, 800),
      department: departments[idx % departments.length]._id,
      createdBy: admins[idx % admins.length]._id,
    }))
  );

  // Medicines
  await Medicine.insertMany([
    { name: "Paracetamol 500mg", price: 30, manufacturer: "MediPharm", stock: 500 },
    { name: "Amoxicillin 500mg", price: 120, manufacturer: "HealWell", stock: 200 },
    { name: "Atorvastatin 10mg", price: 150, manufacturer: "CardioCare", stock: 180 },
    { name: "Pantoprazole 40mg", price: 90, manufacturer: "GastroPlus", stock: 240 },
  ]);

  // Appointments + prescriptions + lab orders
  const appointments = [];
  const prescriptions = [];
  const labOrders = [];
  const appointmentKeys = new Set();

  const slotOptions = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "03:00 PM", "04:00 PM"];

  for (let i = 0; i < 120; i += 1) {
    let patient;
    let doctor;
    let dateObj;
    let dateStr;
    let slot;
    let status;
    let creator;
    let tries = 0;
    let key;

    do {
      patient = pick(patients);
      doctor = pick(doctors);
      dateObj = randomDateWithinDays(lastTwoMonths);
      dateStr = dateObj.toISOString().slice(0, 10);
      slot = pick(slotOptions);
      status = pick(["booked", "arrived", "inConsultation", "completed", "cancelled"]);
      creator = pick([...receptionists.map((r) => r.user), patient.user]);
      key = `${doctor.doctor._id.toString()}-${dateStr}-${slot}`;
      tries += 1;
    } while (appointmentKeys.has(key) && tries < 25);

    if (appointmentKeys.has(key)) {
      continue;
    }
    appointmentKeys.add(key);

    const appointment = await Appointment.create({
      doctorId: doctor.doctor._id,
      doctorUserId: doctor.user._id,
      patientId: patient.user._id,
      patientProfileId: patient.patient._id,
      hospitalLocationId: pick(locations)._id,
      date: dateStr,
      slot,
      status,
      consultationMode: pick(["in-person", "video"]),
      createdBy: creator._id,
    });
    await backdate(Appointment, appointment._id, dateObj);
    appointments.push(appointment);

    if (status === "completed" && Math.random() > 0.2) {
      const prescription = await Prescription.create({
        appointmentId: appointment._id,
        doctorId: doctor.doctor._id,
        patientId: patient.patient._id,
        patientUserId: patient.user._id,
        diagnosis: pick(["Hypertension", "Viral fever", "Type 2 Diabetes", "Chest pain"]),
        advice: "Hydration and follow-up in 2 weeks.",
        medicines: Math.random() > 0.4 ? [
          { name: "Paracetamol 500mg", dosage: "500mg", frequency: "TID", duration: "3 days", quantity: 10 },
        ] : [],
        status: "active",
      });
      prescriptions.push(prescription);
    }

    if (Math.random() > 0.6) {
      const tests = [pick(labTests)];
      const primaryTest = tests[0];
      const labOrder = await LabOrder.create({
        patientId: patient.patient._id,
        patientUserId: patient.user._id,
        doctorId: doctor.doctor._id,
        appointmentId: appointment._id,
        status: pick(["ordered", "sampleCollected", "inProcessing", "reportReady", "reportReleasedToPortal"]),
        paymentStatus: pick(["pending", "paid"]),
        urgency: pick(["routine", "urgent"]),
        totalAmount: randomInt(300, 1200),
      });
      const items = await LabOrderItem.insertMany(
        tests.map((test) => ({
          labOrderId: labOrder._id,
          testId: test._id,
          testType: test.testType,
          testName: test.name,
          price: randomInt(200, 800),
          status: labOrder.status,
          resultValue: Math.random() > 0.5 ? String(randomInt(5, 15)) : "",
          resultUnit: "mg/dL",
          referenceRange: "4 - 12",
        }))
      );
      labOrders.push({ labOrder, items, patient, doctor });

      if (["reportReady", "reportReleasedToPortal"].includes(labOrder.status)) {
        const report = await LabReport.create({
          patientId: patient.patient._id,
          patientUserId: patient.user._id,
          doctorId: doctor.doctor._id,
          appointmentId: appointment._id,
          reportName: "Diagnostic Report",
          reportType: primaryTest.name,
          reportFile: "generated",
          uploadedBy: pick(labTechs).user._id,
          labOrderId: labOrder._id,
          status: "ready",
          releasedToPortal: labOrder.status === "reportReleasedToPortal",
          isSystemGenerated: true,
          releasedAt: labOrder.status === "reportReleasedToPortal" ? randomDateWithinDays(lastTwoMonths) : null,
        });
        await LabOrderItem.updateMany({ labOrderId: labOrder._id }, { $set: { labReportId: report._id } });
      }
    }
  }

  // Pharmacy orders + invoices
  for (let i = 0; i < 30; i += 1) {
    const patient = pick(patients);
    const order = await PharmacyOrder.create({
      patientId: patient.patient._id,
      patientUserId: patient.user._id,
      status: pick(["orderPlaced", "orderAccepted", "readyForPickup", "completed"]),
      paymentStatus: pick(["pending", "paid"]),
      items: [
        {
          medicineName: "Paracetamol 500mg",
          requestedQuantity: 10,
          unitPrice: 30,
          lineTotal: 300,
        },
      ],
    });
    const invoice = await Invoice.create({
      patientId: patient.patient._id,
      patientUserId: patient.user._id,
      pharmacyOrderId: order._id,
      billType: "pharmacy",
      lineItems: [
        { label: "Paracetamol 500mg", category: "pharmacy", quantity: 10, unitPrice: 30, lineTotal: 300 },
      ],
      totalAmount: 300,
      paymentStatus: order.paymentStatus,
      paymentHistory: order.paymentStatus === "paid" ? [{ amount: 300, method: "cash", paidAt: randomDateWithinDays(lastTwoMonths) }] : [],
    });
    await backdate(PharmacyOrder, order._id, randomDateWithinDays(lastTwoMonths));
    await backdate(Invoice, invoice._id, randomDateWithinDays(lastTwoMonths));
  }

  // Staff duty + shift schedules
  const staffUsers = [...doctors, ...nurses, ...receptionists, ...pharmacists, ...labTechs].map((s) => s.user);
  for (const staff of staffUsers) {
    for (let i = 0; i < 6; i += 1) {
      const date = randomDateWithinDays(lastTwoMonths);
      const dateStr = date.toISOString().slice(0, 10);
      const shift = pick(shiftTemplates);
      const start = new Date(`${dateStr}T${shift.startTime}:00`);
      const end = new Date(`${dateStr}T${shift.endTime}:00`);
      await ShiftSchedule.create({
        userId: staff._id,
        role: staff.role,
        date: dateStr,
        shiftType: shift.shiftType,
        startTime: start,
        endTime: end,
        createdBy: pick([...admins, ...subadmins])._id,
      });

      const status = pick(["onDuty", "offDuty", "leave"]);
      const duty = await StaffDuty.create({
        userId: staff._id,
        role: staff.role,
        date: dateStr,
        status,
        startTime: status === "leave" ? null : start,
        endTime: status === "leave" ? null : end,
        totalHours: status === "leave" ? 0 : 8,
        shiftType: shift.shiftType,
        reason: status === "leave" ? "Personal leave" : "",
      });
      await backdate(StaffDuty, duty._id, date);
    }
  }

  // Audit logs + notifications
  for (let i = 0; i < 120; i += 1) {
    const actor = pick([superadmin, ...admins, ...subadmins]);
    await AuditLog.create({
      actorId: actor._id,
      actorName: actor.name,
      actorRole: actor.role,
      action: pick(["created", "updated", "approved", "released"]),
      entityType: pick(["Appointment", "LabOrder", "Invoice", "User"]),
      entityId: pick(appointments)._id,
      details: { note: "System activity logged." },
      createdAt: randomDateWithinDays(lastTwoMonths),
      updatedAt: randomDateWithinDays(lastTwoMonths),
    });
  }

  for (let i = 0; i < 80; i += 1) {
    const recipient = pick([...doctors.map((d) => d.user), ...receptionists.map((r) => r.user), ...labTechs.map((l) => l.user)]);
    await Notification.create({
      recipientType: "employee",
      recipientId: recipient._id,
      key: `demo:${recipient._id}:${i}`,
      type: pick(["appointment", "lab", "pharmacy", "attendance"]),
      title: "System update",
      message: "Demo notification generated for seeded data.",
      status: pick(["read", "unread"]),
      read: Math.random() > 0.5,
      createdAt: randomDateWithinDays(lastTwoMonths),
      updatedAt: randomDateWithinDays(lastTwoMonths),
    });
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
