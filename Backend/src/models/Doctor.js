import mongoose from "mongoose";

const doctorSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    specializationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
      },
    ],

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

    awardIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Award",
      },
    ],

    profileImage: {
      type: String,
    },

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

    isPublished: {
      type: Boolean,
      default: false,
    },

    onboardingStatus: {
      type: String,
      enum: ["created", "invited", "profileIncomplete", "active", "published", "suspended"],
      default: "created",
    },
  },
  { timestamps: true },
);


export default mongoose.model("Doctor", doctorSchema);
