import mongoose from "mongoose";

const departmentSchema = mongoose.Schema({
    code: {
        type: String,
        unique: true,
        sparse: true
    },

    name : {
        type: String,
        required: true,
        unique: true
    },

    description : {
        type: String
    },

    icon: {
        type: String
    },

    image: {
        type: String
    },

    isActive: {
        type: Boolean,
        default: true
    },

    displayOrder: {
        type: Number,
        default: 0
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},

{
    timestamps: true
}
);

export default mongoose.model("Department", departmentSchema);
