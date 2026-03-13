import Department from "../models/Department.js";
import Specialization from "../models/Specialization.js";

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

export const createSpecialization = async (req, res) => {
  try {
    const { name, departmentId, description } = req.body;
    const normalizedName = normalizeName(name);

    if (!normalizedName || !departmentId) {
      return res.status(400).json({ message: "Specialization name and department are required." });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ message: "A valid department is required." });
    }

    const duplicate = await Specialization.findOne({
      departmentId,
      name: new RegExp(`^${normalizedName}$`, "i"),
    });

    if (duplicate) {
      return res.status(400).json({ message: "This specialization already exists for the selected department." });
    }

    const specialization = await Specialization.create({
      name: normalizedName,
      departmentId,
      description,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    return res.status(201).json({
      message: "Specialization created successfully.",
      specialization,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllSpecializations = async (req, res) => {
  try {
    const { search = "", departmentId, isActive } = req.query;
    const filter = {};

    if (departmentId) {
      filter.departmentId = departmentId;
    }

    if (typeof isActive === "string" && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const specializations = await Specialization.find(filter)
      .populate("departmentId", "name isActive")
      .sort({ name: 1 });

    return res.json(specializations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId, description } = req.body;

    const specialization = await Specialization.findById(id);
    if (!specialization) {
      return res.status(404).json({ message: "Specialization not found." });
    }

    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({ message: "A valid department is required." });
      }
      specialization.departmentId = departmentId;
    }

    const normalizedName = name ? normalizeName(name) : specialization.name;
    const duplicate = await Specialization.findOne({
      _id: { $ne: id },
      departmentId: specialization.departmentId,
      name: new RegExp(`^${normalizedName}$`, "i"),
    });

    if (duplicate) {
      return res.status(400).json({ message: "Another specialization with this name already exists in the selected department." });
    }

    specialization.name = normalizedName;
    specialization.description = description ?? specialization.description;
    specialization.updatedBy = req.user?.id;
    await specialization.save();

    return res.json({
      message: "Specialization updated successfully.",
      specialization,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleSpecializationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const specialization = await Specialization.findById(id);

    if (!specialization) {
      return res.status(404).json({ message: "Specialization not found." });
    }

    specialization.isActive = !specialization.isActive;
    specialization.updatedBy = req.user?.id;
    await specialization.save();

    return res.json({
      message: `Specialization ${specialization.isActive ? "activated" : "deactivated"} successfully.`,
      specialization,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
