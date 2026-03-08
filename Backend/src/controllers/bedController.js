import Bed from "../models/Bed.js";

export const addBed = async (req, res) => {
    try {

        const bed = new Bed(req.body);

        await bed.save();

        res.status(201).json({
            success: true,
            message: "Bed created",
            data: bed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// GET ALL BEDS
export const getBeds = async (req, res) => {
    try {

        const beds = await Bed.find().populate("patientId");

        res.status(200).json({
            success: true,
            data: beds
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// ASSIGN BED (ADMIT PATIENT)
export const assignBed = async (req, res) => {
    try {

        const bed = await Bed.findById(req.params.id);

        if (!bed) {
            return res.status(404).json({
                success: false,
                message: "Bed not found"
            });
        }

        if (bed.status === "occupied") {
            return res.status(400).json({
                success: false,
                message: "Bed already occupied"
            });
        }

        bed.status = "occupied";
        bed.patientId = req.body.patientId;
        bed.admittedAt = new Date();

        await bed.save();

        res.status(200).json({
            success: true,
            message: "Patient admitted",
            data: bed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// DISCHARGE PATIENT
export const dischargePatient = async (req, res) => {
    try {

        const bed = await Bed.findById(req.params.id);

        if (!bed) {
            return res.status(404).json({
                success: false,
                message: "Bed not found"
            });
        }

        bed.status = "available";
        bed.patientId = null;
        bed.dischargedAt = new Date();

        await bed.save();

        res.status(200).json({
            success: true,
            message: "Patient discharged",
            data: bed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};