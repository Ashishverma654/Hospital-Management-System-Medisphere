import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
      family: 4,
    });

    console.log("MongoDB Connected");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error?.message || error);
    throw error;
  }
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
