import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const schema = new mongoose.Schema({ name: String });
schema.pre("save", function (next) {
    console.log("Pre save running. Is next a function?", typeof next === "function");
    if (typeof next === "function") next();
});
const TestModel = mongoose.model("TestModels", schema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const doc = new TestModel({ name: "test" });
        await doc.save();
        console.log("Saved successfully!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        process.exit(0);
    }
}
run();
