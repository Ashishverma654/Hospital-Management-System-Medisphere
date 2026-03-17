import express from "express";
import Award from "../models/Award.js";
import Department from "../models/Department.js";
import DiagnosticService from "../models/DiagnosticService.js";
import Doctor from "../models/Doctor.js";
import HealthPackage from "../models/HealthPackage.js";
import HospitalLocation from "../models/HospitalLocation.js";
import Specialization from "../models/Specialization.js";

const router = express.Router();

const publicDoctorPopulate = [
  { path: "userId", select: "name profileImage" },
  { path: "departmentId", select: "name description icon image" },
  { path: "specializationIds", select: "name departmentId" },
  { path: "hospitalLocations", select: "name city state address phone mapUrl" },
];

const mapPublicDoctor = (doctor, awards = []) => ({
  _id: doctor._id,
  userId: doctor.userId,
  title: doctor.title,
  departmentId: doctor.departmentId,
  specializationIds: doctor.specializationIds,
  qualifications: doctor.qualifications,
  experienceYears: doctor.experienceYears,
  consultationFee: doctor.consultationFee,
  consultationFeeVideo: doctor.consultationFeeVideo,
  consultationFeePhone: doctor.consultationFeePhone,
  about: doctor.about,
  expertise: doctor.expertise,
  articles: doctor.articles || [],
  media: doctor.media || [],
  hospitalLocations: doctor.hospitalLocations,
  locationFees: doctor.locationFees || [],
  profileImage: doctor.profileImage || doctor.userId?.profileImage,
  awards,
});

// GET all public locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await HospitalLocation.find({ isActive: true, isPublished: true }).sort({
      name: 1,
    });

    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all public departments
router.get("/departments", async (req, res) => {
  try {
    const { featuredOnly } = req.query;
    const filter = { isActive: true };

    if (featuredOnly === "true") {
      filter.isFeatured = true;
    }

    const departments = await Department.find(filter).sort({
      name: 1,
    });

    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all active public specializations
router.get("/specializations", async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = { isActive: true };

    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const specializations = await Specialization.find(filter)
      .populate("departmentId", "name")
      .sort({ name: 1 });

    res.json(specializations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET public doctors (with filters)
router.get("/doctors", async (req, res) => {
  try {
    const { departmentId, locationId, specializationId, featuredOnly } = req.query;
    const query = { isActive: true, isPublished: true, isDeleted: { $ne: true } };

    if (departmentId) query.departmentId = departmentId;
    if (locationId) query.hospitalLocations = locationId;
    if (specializationId) query.specializationIds = specializationId;
    if (featuredOnly === "true") query.isFeatured = true;

    const doctors = await Doctor.find(query)
      .populate(publicDoctorPopulate)
      .sort({ createdAt: -1 });

    res.json(doctors.map((doctor) => mapPublicDoctor(doctor)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one public doctor
router.get("/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isActive: true,
      isPublished: true,
      isDeleted: { $ne: true },
    }).populate(publicDoctorPopulate);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const awards = await Award.find({
      doctorId: doctor._id,
      type: "doctor",
      status: "Active",
      isPublic: true,
    }).sort({ awardDate: -1, createdAt: -1 });

    return res.json(mapPublicDoctor(doctor, awards));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET public hospital awards
router.get("/awards", async (req, res) => {
  try {
    const awards = await Award.find({
      type: "hospital",
      status: "Active",
      isPublic: true,
    }).sort({ awardDate: -1, createdAt: -1 });

    res.json(awards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET homepage content bundle
router.get("/homepage", async (req, res) => {
  try {
    const [featuredDepartments, fallbackDepartments, featuredDoctors, fallbackDoctors, locations, fallbackLocations, awards, specializations] = await Promise.all([
      Department.find({ isActive: true }).sort({ name: 1 }).limit(6),
      Department.find({ isActive: true }).sort({ name: 1 }).limit(6),
      Doctor.find({ isActive: true, isPublished: true, isDeleted: { $ne: true } })
        .populate(publicDoctorPopulate)
        .sort({ createdAt: -1 })
        .limit(6),
      Doctor.find({ isActive: true, isPublished: true, isDeleted: { $ne: true } })
        .populate(publicDoctorPopulate)
        .sort({ createdAt: -1 })
        .limit(6),
      HospitalLocation.find({ isActive: true, isPublished: true }).sort({ name: 1 }).limit(6),
      HospitalLocation.find({ isActive: true }).sort({ name: 1 }).limit(6),
      Award.find({ type: "hospital", status: "Active", isPublic: true })
        .sort({ featured: -1, displayOrder: 1, awardDate: -1 })
        .limit(6),
      Specialization.find({ isActive: true }).sort({ name: 1 }).limit(12).populate("departmentId", "name"),
    ]);

    res.json({
      featuredDepartments: featuredDepartments.length ? featuredDepartments : fallbackDepartments,
      featuredDoctors: (featuredDoctors.length ? featuredDoctors : fallbackDoctors).map((doctor) => mapPublicDoctor(doctor)),
      locations: locations.length ? locations : fallbackLocations,
      awards: awards.map(a => ({
        ...a.toObject(),
        year: a.awardDate ? new Date(a.awardDate).getFullYear() : ""
      })),
      specializations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET diagnostic services
router.get("/services", async (req, res) => {
  try {
    const services = await DiagnosticService.find({ isActive: true });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET health packages
router.get("/packages", async (req, res) => {
  try {
    const packages = await HealthPackage.find({ isActive: true }).populate(
      "includedServices",
      "name price"
    );
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
