import Department from "../models/Department.js";
import { logAudit } from "../services/auditLogService.js";
import AuditLog from "../models/AuditLog.js";

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

export const createDepartment = async (req, res) => {
  try {
    const { name, description, icon, image, code, isFeatured = false, featureOrder = 0 } = req.body;
    const normalizedName = normalizeName(name);

    if (!normalizedName) {
      return res.status(400).json({ message: "Department name is required." });
    }

    const exists = await Department.findOne({ name: new RegExp(`^${normalizedName}$`, "i") });

    if (exists) {
      return res.status(400).json({ message: "Department already exists." });
    }

    const department = await Department.create({
      name: normalizedName,
      description,
      code,
      icon,
      image,
      isFeatured: Boolean(isFeatured),
      featureOrder: Number(featureOrder) || 0,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "department_created",
      entityType: "Department",
      entityId: department._id,
      details: { name: department.name, code: department.code },
    });

    return res.status(201).json({
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllDepartment = async (req, res) => {
  try {
    const { search = "", isActive } = req.query;
    const filter = {};

    if (typeof isActive === "string" && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const departments = await Department.find(filter)
      .populate("createdBy", "name role")
      .populate("updatedBy", "name role")
      .sort({ name: 1 });

    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, image, code, isFeatured, featureOrder } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    const normalizedName = name ? normalizeName(name) : department.name;

    if (normalizedName !== department.name) {
      const duplicate = await Department.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${normalizedName}$`, "i"),
      });

      if (duplicate) {
        return res.status(400).json({ message: "Another department with this name already exists." });
      }
    }

    department.name = normalizedName;
    department.description = description ?? department.description;
    department.code = code ?? department.code;
    department.icon = icon ?? department.icon;
    department.image = image ?? department.image;
    if (typeof isFeatured === "boolean") {
      department.isFeatured = isFeatured;
    }
    if (featureOrder !== undefined) {
      department.featureOrder = Number(featureOrder) || 0;
    }
    department.updatedBy = req.user?.id;

    await department.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "department_updated",
      entityType: "Department",
      entityId: department._id,
      details: { name: department.name, code: department.code },
    });

    return res.json({
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    department.isActive = !department.isActive;
    department.updatedBy = req.user?.id;
    await department.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: department.isActive ? "department_activated" : "department_deactivated",
      entityType: "Department",
      entityId: department._id,
      details: { isActive: department.isActive, name: department.name },
    });

    return res.json({
      message: `Department ${department.isActive ? "activated" : "deactivated"} successfully.`,
      department,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDepartmentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.find({
      entityType: "Department",
      entityId: id,
    }).sort({ createdAt: -1 });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
