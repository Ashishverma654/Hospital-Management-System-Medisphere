import HospitalLocation from "../models/HospitalLocation.js";

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

export const createLocation = async (req, res) => {
  try {
    const { name, city, state, address, pincode, phone, email, mapUrl, locationType } = req.body;
    const normalizedName = normalizeName(name);

    if (!normalizedName || !city || !address) {
      return res.status(400).json({ message: "Location name, city, and address are required." });
    }

    const duplicate = await HospitalLocation.findOne({ name: new RegExp(`^${normalizedName}$`, "i") });
    if (duplicate) {
      return res.status(400).json({ message: "Location already exists." });
    }

    const location = await HospitalLocation.create({
      name: normalizedName,
      city: normalizeName(city),
      state: state?.trim?.() || "",
      address: address.trim(),
      pincode,
      phone,
      email,
      mapUrl,
      locationType,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    return res.status(201).json({
      message: "Location created successfully.",
      location,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllLocations = async (req, res) => {
  try {
    const { search = "", isActive } = req.query;
    const filter = {};

    if (typeof isActive === "string" && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { city: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const locations = await HospitalLocation.find(filter)
      .populate("createdBy", "name role")
      .populate("updatedBy", "name role")
      .sort({ name: 1 });

    return res.json(locations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, state, address, pincode, phone, email, mapUrl, locationType } = req.body;

    const location = await HospitalLocation.findById(id);
    if (!location) {
      return res.status(404).json({ message: "Location not found." });
    }

    const normalizedName = name ? normalizeName(name) : location.name;
    if (normalizedName !== location.name) {
      const duplicate = await HospitalLocation.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${normalizedName}$`, "i"),
      });
      if (duplicate) {
        return res.status(400).json({ message: "Another location with this name already exists." });
      }
    }

    location.name = normalizedName;
    location.city = city ? normalizeName(city) : location.city;
    location.state = state ?? location.state;
    location.address = address ?? location.address;
    location.pincode = pincode ?? location.pincode;
    location.phone = phone ?? location.phone;
    location.email = email ?? location.email;
    location.mapUrl = mapUrl ?? location.mapUrl;
    location.locationType = locationType ?? location.locationType;
    location.updatedBy = req.user?.id;
    await location.save();

    return res.json({
      message: "Location updated successfully.",
      location,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await HospitalLocation.findById(id);

    if (!location) {
      return res.status(404).json({ message: "Location not found." });
    }

    location.isActive = !location.isActive;
    location.updatedBy = req.user?.id;
    await location.save();

    return res.json({
      message: `Location ${location.isActive ? "activated" : "deactivated"} successfully.`,
      location,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
