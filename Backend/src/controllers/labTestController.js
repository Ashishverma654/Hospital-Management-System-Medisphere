import LabTest from "../models/LabTest.js";

export const createLabTest = async (req, res) => {
  try {
    const test = await LabTest.create({
      name: req.body.name,
      testType: req.body.testType,
      description: req.body.description,
      isActive: req.body.isActive ?? true,
    });
    return res.status(201).json({ success: true, data: test });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateLabTest = async (req, res) => {
  try {
    const test = await LabTest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!test) {
      return res.status(404).json({ message: "Lab test not found." });
    }
    return res.json({ success: true, data: test });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLabTests = async (req, res) => {
  try {
    const { testType, isActive, search } = req.query;
    const filter = {};
    if (testType) filter.testType = testType;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    const tests = await LabTest.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: tests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
