import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import connectDB from '../src/config/database.js';

dotenv.config();

const removeUsers = async () => {
  try {
    await connectDB();
    const employeeIds = ['SBM-266680'];
    
    for (const employeeId of employeeIds) {
      const result = await User.deleteOne({ employeeId });
      if (result.deletedCount === 1) {
        console.log(`User with Employee ID ${employeeId} removed successfully.`);
      } else {
        console.log(`User with Employee ID ${employeeId} not found.`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error removing users:', err.message);
    process.exit(1);
  }
};

removeUsers();
