import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localLogoPath = path.resolve(__dirname, "..", "assets", "mediflow-logo.png");

const resolveBranding = (settings = {}) => ({
  hospitalName: settings.hospitalName || "MediFlow Hospital",
  address: settings.address || "Ambedkar Road, City Center",
  phone: settings.phone || "9247 422727, 9550 422727",
  email: settings.email || "info@mediflow.care",
  website: settings.website || process.env.FRONTEND_URL || "https://mediflow.care",
  logoUrl: settings.logo || "",
  logoPath: localLogoPath,
});

const fetchImageBuffer = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    try {
      if (url.startsWith("data:")) {
        const base64 = url.split(",")[1];
        return resolve(Buffer.from(base64 || "", "base64"));
      }
      const client = url.startsWith("https") ? https : http;
      client
        .get(url, (resp) => {
          const chunks = [];
          resp.on("data", (chunk) => chunks.push(chunk));
          resp.on("end", () => resolve(Buffer.concat(chunks)));
        })
        .on("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });

export const generatePrescriptionPDF = async (res, prescription, settings = {}) => {

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=prescription-${prescription._id}.pdf`
    );

    doc.pipe(res);

    const branding = resolveBranding(settings);
    const remoteLogo = await fetchImageBuffer(branding.logoUrl);
    if (remoteLogo) {
        doc.image(remoteLogo, 40, 24, { width: 36, height: 36 });
    } else if (fs.existsSync(branding.logoPath)) {
        doc.image(branding.logoPath, 40, 24, { width: 36, height: 36 });
    }
    doc.fontSize(16).font("Helvetica-Bold").text(branding.hospitalName, 90, 24);
    doc.fontSize(9).font("Helvetica").text(branding.address, 90, 44);
    doc.text(`Ph: ${branding.phone} • ${branding.email}`, 90, 58);
    doc.text(branding.website, 90, 72);
    doc.moveDown(3);

    doc.fontSize(20).text("Hospital Prescription", { align: "center" });

    doc.moveDown();

    doc.fontSize(12).text(`Prescription ID: ${prescription._id}`);
    doc.text(`Diagnosis: ${prescription.diagnosis}`);

    doc.moveDown();

    doc.text("Medicines:");

    prescription.medicines.forEach((med, index) => {
        doc.text(
            `${index + 1}. ${med.name} - ${med.dosage} - ${med.duration}`
        );
    });

    doc.moveDown();

    doc.text(`Notes: ${prescription.notes || "N/A"}`);

    doc.end();
};
