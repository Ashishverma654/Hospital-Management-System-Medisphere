import Department from "../models/Department.js";

export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Department.findOne({ name });

    if (exists) {
      return res.status(400).json({ message: "Department Already Exists." });
    }

    const department = await Department.create({
      name,
      description,
    });

    res
      .status(201)
      .json({ message: "Department Created Succesfully. ", department });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllDepartment = async (req, res) => {
  try {
    const departmnets = await Department.find();

    res.json(departmnets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    await Department.findByIdAndDelete(id);

    res.json({ message: "Department Deleted. " });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
