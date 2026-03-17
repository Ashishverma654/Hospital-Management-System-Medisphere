import mongoose from 'mongoose';

const receptionistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  title: String,
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  qualifications: [String],
  education: [String],
  certifications: [String],
  skills: [String],
  experienceYears: Number,
  joiningDate: Date,
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract'],
    default: 'full-time'
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    default: 'morning'
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('Receptionist', receptionistSchema);
