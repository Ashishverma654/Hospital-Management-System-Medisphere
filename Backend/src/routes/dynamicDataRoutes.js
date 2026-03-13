import express from "express";
import HospitalLocation from "../models/HospitalLocation.js";
import Department from "../models/Department.js";
import Specialization from "../models/Specialization.js";
import DiagnosticService from "../models/DiagnosticService.js";
import HealthPackage from "../models/HealthPackage.js";
import Doctor from "../models/Doctor.js";

const router = express.Router();

// GET all locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await HospitalLocation.find({ isActive: true });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all active specializations
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

// GET all doctors (with filters)
router.get("/doctors", async (req, res) => {
  try {
    const { departmentId, locationId } = req.query;
    let query = { isActive: true };
    
    if (departmentId) query.departmentId = departmentId;
    if (locationId) query.hospitalLocations = locationId;

    const doctors = await Doctor.find(query)
      .populate("userId", "name email profileImage")
      .populate("departmentId", "name")
      .populate("hospitalLocations", "name city");
    
    res.json(doctors);
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
    const packages = await HealthPackage.find({ isActive: true })
      .populate("includedServices", "name price");
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
