import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const UserSchema = new mongoose.Schema({
  name: String,
  role: String,
});

const DepartmentSchema = new mongoose.Schema({
  name: String,
  code: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName: String,
  actorRole: String,
  action: String,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  details: Object,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

async function backfill() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not found in environment variables.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      console.error('No superadmin user found.');
      process.exit(1);
    }

    console.log(`Found superadmin: ${superadmin.name} (${superadmin._id})`);

    const allDepts = await Department.find({});
    console.log(`Total departments found: ${allDepts.length}`);
    
    let logsCreated = 0;
    for (const d of allDepts) {
      const existingLog = await AuditLog.findOne({
        entityType: 'Department',
        entityId: d._id,
        action: 'department_created'
      });

      if (!existingLog) {
        await AuditLog.create({
          actorId: superadmin._id,
          actorName: superadmin.name,
          actorRole: superadmin.role,
          action: 'department_created',
          entityType: 'Department',
          entityId: d._id,
          details: { name: d.name, code: d.code, backfilled: true },
          createdAt: d.createdAt || new Date()
        });
        logsCreated++;
      }
    }

    console.log(`Audit logs created: ${logsCreated}`);
    process.exit(0);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

backfill();
