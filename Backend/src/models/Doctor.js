import mongoose from "mongoose";

const doctorSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    title: {
      type: String, // e.g., Director, Senior Consultant
      default: "Consultant"
    },

    qualifications: [String], // e.g., ["MBBS", "MD", "DM"]

    experienceYears: {
       type: Number,
       required: true,
       default: 5
    },

    consultationFee: {
      type: Number,
      required: true,
      default: 500
    },

    about: {
      type: String,
    },

    expertise: [String], // e.g., ["Luminal Gastroenterology", "Therapeutic Endoscopy"]

    articles: [
      {
        title: String,
        date: String,
        link: String,
        image: String
      }
    ],

    media: [
      {
        type: { type: String, enum: ["video", "image", "article"], default: "video" },
        title: String,
        url: String,
        thumbnail: String
      }
    ],

    hospitalLocations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalLocation",
      },
    ],

    rating: {
      type: Number,
      default: 0,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);


export default mongoose.model("Doctor", doctorSchema);