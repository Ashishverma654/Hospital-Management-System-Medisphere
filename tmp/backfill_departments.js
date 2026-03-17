import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../Backend/.env') });

const UserSchema = new mongoose.Schema({
  name: String,
  role: String,
});

const DepartmentSchema = new mongoose.Schema({
  name: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);

async function backfill() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      console.error('No superadmin user found. Please ensure at least one superadmin exists.');
      process.exit(1);
    }

    console.log(`Found superadmin: ${superadmin.name} (${superadmin._id})`);

    const result = await Department.updateMany(
      { $or: [{ createdBy: { $exists: false } }, { createdBy: null }] },
      { 
        $set: { 
          createdBy: superadmin._id,
          createdAt: new Date()
        } 
      }
    );

    console.log(`Backfill complete. Records updated: ${result.modifiedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

backfill();
