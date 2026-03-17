import Award from "../models/Award.js";
import Doctor from "../models/Doctor.js";
import AuditLog from "../models/AuditLog.js";
import { logAudit } from "../services/auditLogService.js";

const normalizeText = (value = "") => value.trim().replace(/\s+/g, " ");

export const createAward = async (req, res) => {
  try {
    const { 
      type, 
      doctorId, 
      title, 
      category,
      organization, 
      issuedByType,
      awardDate, 
      location,
      description, 
      certificateUrl,
      isPublic,
      featured,
      displayOrder,
      status 
    } = req.body;

    if (!type || !title || !category || !organization || !issuedByType || !awardDate || !description) {
      return res.status(400).json({ message: "Mandatory fields are missing." });
    }

    if (!req.file && !req.body.image) {
      return res.status(400).json({ message: "Award image is required." });
    }

    if (type === "doctor") {
      if (!doctorId) {
        return res.status(400).json({ message: "Doctor award requires a valid doctor." });
      }
    }

    const award = await Award.create({
      type,
      doctorId: type === "doctor" ? doctorId : undefined,
      title: normalizeText(title),
      category,
      organization: normalizeText(organization),
      issuedByType,
      awardDate: new Date(awardDate),
      location: location || undefined,
      description,
      image: req.file ? req.file.path : req.body.image,
      certificateUrl,
      isPublic: isPublic === "true" || isPublic === true,
      featured: featured === "true" || featured === true,
      displayOrder: Number(displayOrder) || 0,
      status: status || "Active",
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "award_created",
      entityType: "Award",
      entityId: award._id,
      details: { title: award.title, type: award.type },
    });

    const populatedAward = await Award.findById(award._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    }).populate("location", "name city");

    return res.status(201).json({
      message: "Award created successfully.",
      award: populatedAward,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPublicAwards = async (req, res) => {
  try {
    const awards = await Award.find({ isPublic: true, status: "Active" })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" },
      })
      .populate("location", "name city")
      .sort({ featured: -1, displayOrder: 1, awardDate: -1 });

    return res.json(awards);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllAwards = async (req, res) => {
  try {
    const { type, status, category, search = "" } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { organization: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const awards = await Award.find(filter)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" },
      })
      .populate("location", "name city")
      .sort({ createdAt: -1 });

    return res.json(awards);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAward = async (req, res) => {
  try {
    const award = await Award.findById(req.params.id);
    if (!award) {
      return res.status(404).json({ message: "Award not found." });
    }

    const { 
      type, 
      doctorId, 
      title, 
      category,
      organization, 
      issuedByType,
      awardDate, 
      location,
      description, 
      certificateUrl,
      isPublic,
      featured,
      displayOrder,
      status 
    } = req.body;

    if (type) award.type = type;
    if (type === "doctor") {
      award.doctorId = doctorId || award.doctorId;
    } else if (type === "hospital") {
      award.doctorId = undefined;
    }

    if (title) award.title = normalizeText(title);
    if (category) award.category = category;
    if (organization) award.organization = normalizeText(organization);
    if (issuedByType) award.issuedByType = issuedByType;
    if (awardDate) award.awardDate = new Date(awardDate);
    if (location !== undefined) award.location = location || undefined;
    if (description) award.description = description;
    if (req.file) award.image = req.file.path;
    if (certificateUrl !== undefined) award.certificateUrl = certificateUrl;
    
    if (isPublic !== undefined) award.isPublic = isPublic === "true" || isPublic === true;
    if (featured !== undefined) award.featured = featured === "true" || featured === true;
    if (displayOrder !== undefined) award.displayOrder = Number(displayOrder) || 0;
    if (status) award.status = status;
    award.updatedBy = req.user?.id;
 
    await award.save();
 
    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "award_updated",
      entityType: "Award",
      entityId: award._id,
      details: { title: award.title, type: award.type },
    });

    const populatedAward = await Award.findById(award._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    }).populate("location", "name city");

    return res.json({
      message: "Award updated successfully.",
      award: populatedAward,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleAwardStatus = async (req, res) => {
  try {
    const award = await Award.findById(req.params.id);
    if (!award) {
      return res.status(404).json({ message: "Award not found." });
    }

    award.status = award.status === "Active" ? "Hidden" : "Active";
    award.updatedBy = req.user?.id;
    await award.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: award.status === "Active" ? "award_activated" : "award_hidden",
      entityType: "Award",
      entityId: award._id,
      details: { status: award.status, title: award.title },
    });

    return res.json({
      message: `Award is now ${award.status.toLowerCase()}.`,
      award,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAwardHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.find({
      entityType: "Award",
      entityId: id,
    }).sort({ createdAt: -1 });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
