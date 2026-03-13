import Award from "../models/Award.js";
import Doctor from "../models/Doctor.js";

const normalizeText = (value = "") => value.trim().replace(/\s+/g, " ");

export const createAward = async (req, res) => {
  try {
    const { type, doctorId, title, organization, year, description, image, isActive = true } = req.body;

    if (!type || !title || !organization) {
      return res.status(400).json({ message: "Type, title, and organization are required." });
    }

    if (type === "doctor") {
      if (!doctorId) {
        return res.status(400).json({ message: "Doctor award requires a valid doctor." });
      }

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({ message: "Doctor not found for this award." });
      }
    }

    const award = await Award.create({
      type,
      doctorId: type === "doctor" ? doctorId : undefined,
      title: normalizeText(title),
      organization: normalizeText(organization),
      year: year ? Number(year) : undefined,
      description,
      image,
      isActive: Boolean(isActive),
    });

    const populatedAward = await Award.findById(award._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    });

    return res.status(201).json({
      message: "Award created successfully.",
      award: populatedAward,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllAwards = async (req, res) => {
  try {
    const { type, isActive, doctorId, search = "" } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (doctorId) filter.doctorId = doctorId;
    if (typeof isActive === "string" && isActive !== "") {
      filter.isActive = isActive === "true";
    }
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
      .sort({ year: -1, createdAt: -1 });

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

    const { type, doctorId, title, organization, year, description, image, isActive } = req.body;

    const nextType = type || award.type;
    if (nextType === "doctor") {
      const targetDoctorId = doctorId || award.doctorId;
      if (!targetDoctorId) {
        return res.status(400).json({ message: "Doctor award requires a doctor." });
      }

      const doctor = await Doctor.findById(targetDoctorId);
      if (!doctor) {
        return res.status(400).json({ message: "Doctor not found for this award." });
      }

      award.doctorId = targetDoctorId;
    } else {
      award.doctorId = undefined;
    }

    award.type = nextType;
    award.title = title ? normalizeText(title) : award.title;
    award.organization = organization ? normalizeText(organization) : award.organization;
    award.year = year !== undefined ? Number(year) || undefined : award.year;
    award.description = description ?? award.description;
    award.image = image ?? award.image;
    if (typeof isActive === "boolean") {
      award.isActive = isActive;
    }

    await award.save();

    const populatedAward = await Award.findById(award._id).populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    });

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

    award.isActive = !award.isActive;
    await award.save();

    return res.json({
      message: `Award ${award.isActive ? "activated" : "deactivated"} successfully.`,
      award,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
