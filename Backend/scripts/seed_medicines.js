import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Medicine from "../src/models/Medicine.js";
import MedicineStockLog from "../src/models/MedicineStockLog.js";
import User from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const pharmacistArg = args.find((arg) => arg.startsWith("--pharmacist="));
const pharmacistId = pharmacistArg ? pharmacistArg.split("=")[1] : null;
const emailArg = args.find((arg) => arg.startsWith("--email="));
const pharmacistEmail = emailArg ? emailArg.split("=")[1]?.toLowerCase() : null;
const countArg = args.find((arg) => arg.startsWith("--count="));
const seedCount = countArg ? Number(countArg.split("=")[1]) : 24;
const stockArg = args.find((arg) => arg.startsWith("--stock="));
const forcedStock = stockArg ? Number(stockArg.split("=")[1]) : null;
const updateExisting = args.includes("--update-existing");

const medicineCatalog = [
  { name: "Paracetamol 500mg", manufacturer: "Sunrise Labs", category: "Analgesic", unit: "tablet" },
  { name: "Ibuprofen 400mg", manufacturer: "CureWell", category: "NSAID", unit: "tablet" },
  { name: "Azithromycin 500mg", manufacturer: "BioMedix", category: "Antibiotic", unit: "tablet" },
  { name: "Amoxicillin 500mg", manufacturer: "BioMedix", category: "Antibiotic", unit: "capsule" },
  { name: "Ciprofloxacin 500mg", manufacturer: "NovaCare", category: "Antibiotic", unit: "tablet" },
  { name: "Metformin 500mg", manufacturer: "GlucoLife", category: "Antidiabetic", unit: "tablet" },
  { name: "Amlodipine 5mg", manufacturer: "CardioSure", category: "Antihypertensive", unit: "tablet" },
  { name: "Losartan 50mg", manufacturer: "CardioSure", category: "Antihypertensive", unit: "tablet" },
  { name: "Atorvastatin 10mg", manufacturer: "LipiCare", category: "Statin", unit: "tablet" },
  { name: "Omeprazole 20mg", manufacturer: "GastroPlus", category: "PPI", unit: "capsule" },
  { name: "Pantoprazole 40mg", manufacturer: "GastroPlus", category: "PPI", unit: "tablet" },
  { name: "Levocetirizine 5mg", manufacturer: "AllerEase", category: "Antihistamine", unit: "tablet" },
  { name: "Cetirizine 10mg", manufacturer: "AllerEase", category: "Antihistamine", unit: "tablet" },
  { name: "Salbutamol Inhaler", manufacturer: "AirFlow", category: "Bronchodilator", unit: "inhaler" },
  { name: "Montelukast 10mg", manufacturer: "AirFlow", category: "Antiasthmatic", unit: "tablet" },
  { name: "Hydroxyzine 25mg", manufacturer: "CalmCare", category: "Anxiolytic", unit: "tablet" },
  { name: "Dolo 650mg", manufacturer: "Sunrise Labs", category: "Analgesic", unit: "tablet" },
  { name: "Diclofenac Gel 1%", manufacturer: "PainFree", category: "Topical NSAID", unit: "tube" },
  { name: "ORS Sachet", manufacturer: "HydraLife", category: "Electrolyte", unit: "sachet" },
  { name: "Vitamin D3 60000 IU", manufacturer: "VitaCore", category: "Supplement", unit: "tablet" },
  { name: "Calcium 500mg", manufacturer: "VitaCore", category: "Supplement", unit: "tablet" },
  { name: "Iron + Folic Acid", manufacturer: "VitaCore", category: "Supplement", unit: "tablet" },
  { name: "Insulin Glargine", manufacturer: "GlucoLife", category: "Antidiabetic", unit: "vial" },
  { name: "Lactulose Syrup", manufacturer: "GastroPlus", category: "Laxative", unit: "bottle" },
  { name: "Amoxiclav 625mg", manufacturer: "BioMedix", category: "Antibiotic", unit: "tablet" },
  { name: "Ranitidine 150mg", manufacturer: "GastroPlus", category: "H2 Blocker", unit: "tablet" },
  { name: "Ondansetron 4mg", manufacturer: "NauseaCare", category: "Antiemetic", unit: "tablet" },
  { name: "Domperidone 10mg", manufacturer: "NauseaCare", category: "Antiemetic", unit: "tablet" },
  { name: "Clopidogrel 75mg", manufacturer: "CardioSure", category: "Antiplatelet", unit: "tablet" },
  { name: "Aspirin 75mg", manufacturer: "CardioSure", category: "Antiplatelet", unit: "tablet" },
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const randomDateWithinDays = (days) => {
  const now = Date.now();
  const past = now - days * 24 * 60 * 60 * 1000;
  const ts = randomBetween(past, now);
  return new Date(ts);
};

const buildMedicinePayload = (template) => {
  const stock = Number.isFinite(forcedStock) ? forcedStock : randomBetween(18, 220);
  const lowStockThreshold = randomBetween(8, 20);
  const expiryDate = randomDateWithinDays(365 * 2);
  const batchNumber = `BATCH-${randomBetween(1000, 9999)}-${randomBetween(10, 99)}`;
  const supplier = randomFrom(["MediSupply Co.", "Apollo Distributors", "HealthLine Traders", "Wellness Wholesale"]);
  return {
    ...template,
    price: randomBetween(20, 480),
    stock,
    lowStockThreshold,
    expiryDate,
    supplier,
    batchNumber,
  };
};

async function seedMedicines() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    let pharmacistUser = null;
    if (pharmacistId) {
      pharmacistUser = await User.findById(pharmacistId);
    } else if (pharmacistEmail) {
      pharmacistUser = await User.findOne({ email: pharmacistEmail });
    } else {
      pharmacistUser = await User.findOne({ role: "pharmacist", isActive: true }).sort({ createdAt: -1 });
    }

    if (!pharmacistUser) {
      console.error("No pharmacist user found. Provide --pharmacist=<userId> or --email=<email>.");
      process.exit(1);
    }

    const chosen = medicineCatalog.slice(0, Math.max(1, Math.min(seedCount, medicineCatalog.length)));
    const now = new Date();
    let createdCount = 0;
    let skippedCount = 0;

    for (const template of chosen) {
      const exists = await Medicine.findOne({ name: template.name });
      if (exists) {
        if (!updateExisting) {
          skippedCount += 1;
          continue;
        }
        const prevStock = Number(exists.stock || 0);
        const payload = buildMedicinePayload(template);
        const newStock = payload.stock;
        exists.stock = newStock;
        exists.price = payload.price;
        exists.lowStockThreshold = payload.lowStockThreshold;
        exists.expiryDate = payload.expiryDate;
        exists.supplier = payload.supplier;
        exists.batchNumber = payload.batchNumber;
        exists.unit = payload.unit || exists.unit;
        exists.manufacturer = payload.manufacturer || exists.manufacturer;
        exists.category = payload.category || exists.category;
        await exists.save();

        await MedicineStockLog.create({
          medicineId: exists._id,
          changeType: "adjustment",
          quantityChange: newStock - prevStock,
          previousStock: prevStock,
          newStock,
          performedByUserId: pharmacistUser._id,
          performedByName: pharmacistUser.name,
          performedByRole: pharmacistUser.role,
          notes: "Stock adjusted during inventory seed update.",
        });

        createdCount += 1;
        console.log(`Updated ${exists.name}`);
        continue;
      }
      const createdAt = randomDateWithinDays(14);
      const payload = buildMedicinePayload(template);
      const medicine = await Medicine.create({
        ...payload,
        createdAt,
        updatedAt: createdAt,
      });

      await MedicineStockLog.create({
        medicineId: medicine._id,
        changeType: "initial",
        quantityChange: payload.stock,
        previousStock: 0,
        newStock: payload.stock,
        performedByUserId: pharmacistUser._id,
        performedByName: pharmacistUser.name,
        performedByRole: pharmacistUser.role,
        notes: "Initial stock added during inventory setup.",
        createdAt,
        updatedAt: createdAt,
      });

      createdCount += 1;
      console.log(`Seeded ${medicine.name}`);
    }

    console.log(`\nDone. Created ${createdCount} medicines. Skipped ${skippedCount} existing.`);
    console.log(`Pharmacist: ${pharmacistUser.name} (${pharmacistUser._id})`);
    console.log(`Timestamp spread: last 14 days`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding medicines:", error);
    process.exit(1);
  }
}

seedMedicines();
