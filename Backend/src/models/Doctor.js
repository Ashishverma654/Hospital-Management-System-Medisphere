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
    education: [String],
    certifications: [String],

    licenseNumber: String,
    licenseExpiryDate: Date,
    joiningDate: Date,
    roomNumber: String,

    emergencyContactName: String,
    emergencyContactNumber: String,
    emergencyContactRelationship: String,

    docLicense: String, // Cloudinary URL
    docEducation: String, // Cloudinary URL
    docAdditional: String, // Cloudinary URL

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
    consultationFeeVideo: {
      type: Number,
      default: null,
    },
    consultationFeePhone: {
      type: Number,
      default: null,
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

    locationFees: [
      {
        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "HospitalLocation",
        },
        fee: Number,
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    history: [
      {
        action: { type: String, required: true },
        performedBy: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: String,
          role: String,
        },
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);


export default mongoose.model("Doctor", doctorSchema);
