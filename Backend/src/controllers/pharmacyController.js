import Medicine from "../models/Medicine.js";

export const addMedicine = async (req, res) => {
    try {
        const medicine = new Medicine(req.body);

        await medicine.save();

        res.status(201).json({
            success: true,
            message: "Medicine Added",
            data: medicine
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getMedicines = async (req, res) => {
    try {
        const medicine = await Medicine.find();

        res.status(200).json({
            success: true,
            data: medicine
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found." });
        }
        res.status(200).json({ success: true, data: medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found." });
        }
        res.status(200).json({ success: true, message: "Medicine updated.", data: medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const deleteMedicine = async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Medicine Deleted."
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};