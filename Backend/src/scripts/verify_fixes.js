import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateUniqueId } from '../utils/idGenerator.js';
import User from '../models/User.js';
import { ID_PREFIXES } from '../constants/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runTest = async () => {
  try {
    console.log('Environment Path:', path.join(__dirname, '../../.env'));
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Defined' : 'UNDEFINED');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Testing ID generation for diverse roles:');
    
    const rolesToTest = ['doctor', 'nurse', 'patient', 'admin'];
    
    for (const role of rolesToTest) {
      const prefix = ID_PREFIXES[role] || "EMP";
      const id = await generateUniqueId(User, role === 'patient' ? 'patientId' : 'employeeId', prefix);
      console.log(`- Generated ${role} ID: ${id}`);
      
      if (!id.startsWith(prefix)) {
        throw new Error(`ID ${id} does not start with prefix ${prefix}`);
      }
    }

    console.log('\nVerification Successful: ID generation is working correctly.');
  } catch (error) {
    console.error('Verification Failed:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

runTest();
