import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const AuditLogSchema = new mongoose.Schema({
  actorId: mongoose.Schema.Types.ObjectId,
  actorName: String,
  actorRole: String,
  action: String,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  details: Object,
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const logs = await AuditLog.find({ entityType: 'Department' });
    console.log(`Found ${logs.length} AuditLog entries for Department`);
    
    logs.forEach(log => {
      console.log(`LOG: Action: ${log.action}, EntityID: ${log.entityId}, Actor: ${log.actorName}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLogs();
