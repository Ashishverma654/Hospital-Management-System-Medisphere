import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Load environment variables directly from .env file
dotenv.config();

async function runAttack() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Pick the first patient we can find to test with
    const db = mongoose.connection.db;
    const userDoc = await db.collection("users").findOne({ role: "patient" });
    if (!userDoc) throw new Error("No patient found");
    
    // Create a temporary JWT just for this test
    const token = jwt.sign(
      { id: userDoc._id.toString(), role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    console.log("Generated token for patient:", userDoc.email);
    
    // Pick first doctor
    const docDoc = await db.collection("doctors").findOne({});
    if (!docDoc) throw new Error("No doctor found");
    const doctorId = docDoc._id.toString();

    // Book appointment
    console.log("Triggering booking error...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const bookRes = await fetch("http://localhost:3500/api/appointments", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        doctorId,
        date: dateStr,
        slot: "10:00",
        visitType: "newConsultation",
        consultationMode: "in-person",
        reasonForVisit: "Test",
      })
    });
    
    const text = await bookRes.text();
    console.log("HTTP STATUS:", bookRes.status);
    console.log("RESPONSE BODY:", text);
    
  } catch (error) {
    console.error("Test Error:", error.message);
  } finally {
    process.exit(0);
  }
}

runAttack();
