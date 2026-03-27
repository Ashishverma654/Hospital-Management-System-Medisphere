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

export const generateLabOrderPDF = async (res, labOrder, items = [], settings = {}) => {
  const doc = new PDFDocument({
    margin: 40,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=lab-order-${labOrder._id}.pdf`
  );

  doc.pipe(res);

  const branding = resolveBranding(settings);
  const remoteLogo = await fetchImageBuffer(branding.logoUrl);
  if (remoteLogo) {
    doc.image(remoteLogo, 40, 24, { width: 36, height: 36 });
  } else if (fs.existsSync(branding.logoPath)) {
    doc.image(branding.logoPath, 40, 24, { width: 36, height: 36 });
  }

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text(branding.hospitalName, 90, 24);
  doc.fontSize(9).font("Helvetica").text(branding.address, 90, 44);
  doc.text(`Ph: ${branding.phone} • ${branding.email}`, 90, 58);
  doc.text(branding.website, 90, 72);
  doc.moveDown(2);
  doc.fontSize(14).font("Helvetica-Bold").text("LAB ORDER FORM", {
    align: "center",
  });
  doc.fontSize(10).font("Helvetica").text("Laboratory Test Request", {
    align: "center",
  });

  doc.moveDown();

  // Order Details
  doc.fontSize(11).font("Helvetica-Bold").text("Order Details", {
    underline: true,
  });

  doc.fontSize(10).font("Helvetica");
  doc.text(`Order ID: ${labOrder._id}`);
  doc.text(
    `Date: ${new Date(labOrder.createdAt).toLocaleDateString()}`
  );
  doc.text(`Status: ${labOrder.status || "pending"}`);
  doc.text(`Urgency: ${labOrder.urgency || "routine"}`);

  doc.moveDown();

  // Patient Information
  doc.fontSize(11).font("Helvetica-Bold").text("Patient Information", {
    underline: true,
  });

  doc.fontSize(10).font("Helvetica");
  const patientName = labOrder.patientUserId?.name || "N/A";
  const patientPhone = labOrder.patientUserId?.phone || "N/A";
  const patientEmail = labOrder.patientUserId?.email || "N/A";

  doc.text(`Name: ${patientName}`);
  doc.text(`Phone: ${patientPhone}`);
  doc.text(`Email: ${patientEmail}`);

  doc.moveDown();

  // Doctor Information
  doc.fontSize(11).font("Helvetica-Bold").text("Ordering Doctor", {
    underline: true,
  });

  doc.fontSize(10).font("Helvetica");
  const doctorName = labOrder.doctorId?.userId?.name || "N/A";
  doc.text(`Doctor: ${doctorName}`);

  doc.moveDown();

  // Tests Requested
  doc.fontSize(11).font("Helvetica-Bold").text("Tests Requested", {
    underline: true,
  });

  doc.fontSize(10).font("Helvetica");

  if (items && items.length > 0) {
    items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.testName || "Unnamed Test"} - ₹${
          item.price || "0"
        }`
      );
    });
  } else {
    doc.text("No tests specified");
  }

  doc.moveDown();

  // Notes
  if (labOrder.notes) {
    doc.fontSize(11).font("Helvetica-Bold").text("Clinical Notes", {
      underline: true,
    });
    doc.fontSize(10).font("Helvetica");
    doc.text(labOrder.notes, { width: 500 });
    doc.moveDown();
  }

  // Total Amount
  doc.fontSize(11).font("Helvetica-Bold").text("Total Amount");
  doc.fontSize(12).font("Helvetica-Bold").text(
    `₹${labOrder.totalAmount || 0}`
  );

  doc.moveDown();

  // Footer
  doc.fontSize(9).font("Helvetica");
  doc.text("This is an automated lab order form from the hospital system.", {
    align: "center",
  });
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    {
      align: "center",
    }
  );

  doc.end();
};
