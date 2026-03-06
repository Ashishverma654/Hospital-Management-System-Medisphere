import mongoose from "mongoose";

const departmentSchema = mongoose.Schema({
    name : {
        type: String,
        required: true,
        unique: true
    },

    description : {
        type: String
    },

    isActive: {
        type: Boolean,
        default: true
    }
},

{
    timestamps: true
}
);

export default mongoose.model("Department", departmentSchema);