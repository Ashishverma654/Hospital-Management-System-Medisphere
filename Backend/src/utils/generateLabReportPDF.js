import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import http from "http";
import https from "https";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "—";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";
const calcAge = (dob) => {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localLogoPath = path.resolve(__dirname, "..", "assets", "mediflow-logo.png");

const resolveBranding = (settings = {}) => ({
  hospitalName: settings.hospitalName || "MediFlow Diagnostics",
  phone: settings.phone || "+91 12345 67890",
  email: settings.email || "lab@mediflow.com",
  website: settings.website || process.env.FRONTEND_URL || "https://mediflow.care",
  regNo: settings.registrationNumber || "HMS-0001",
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

const drawResultsHeader = (doc, margin, contentWidth, y, borderColor) => {
  const rowHeight = 20;
  const colWidths = [
    contentWidth * 0.42,
    contentWidth * 0.18,
    contentWidth * 0.16,
    contentWidth * 0.24,
  ];
  doc.rect(margin, y, contentWidth, rowHeight).fill("#eef2f7");
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
  let x = margin + 6;
  ["TEST", "VALUE", "UNIT", "REFERENCE"].forEach((header, idx) => {
    doc.text(header, x, y + 5, { width: colWidths[idx] - 12 });
    x += colWidths[idx];
  });
  doc
    .moveTo(margin, y + rowHeight)
    .lineTo(margin + contentWidth, y + rowHeight)
    .stroke(borderColor);
  return { rowHeight, colWidths, nextY: y + rowHeight };
};

export const generateLabReportPDF = async ({
  res,
  report,
  labOrder,
  items = [],
  downloadUrl,
  settings = {},
}) => {
  const doc = new PDFDocument({ margin: 36, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=lab-report-${report._id}.pdf`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin - doc.page.margins.right;

  const primary = "#0b3b66";
  const textDark = "#111827";
  const textMuted = "#4b5563";
  const border = "#d1d5db";
  const branding = resolveBranding(settings);

  const barcodeValue =
    labOrder?.orderNumber || report?._id?.toString() || "LAB-REPORT";
  let barcodeBuffer = null;
  try {
    barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: barcodeValue,
      scale: 2,
      height: 10,
      includetext: false,
    });
  } catch {
    barcodeBuffer = null;
  }

  let qrBuffer = null;
  try {
    if (downloadUrl) {
      qrBuffer = await QRCode.toBuffer(downloadUrl, { width: 90, margin: 1 });
    }
  } catch {
    qrBuffer = null;
  }

  // Header banner
  doc.rect(0, 0, pageWidth, 90).fill(primary);
  doc.fillColor("#ffffff");
  const remoteLogo = await fetchImageBuffer(branding.logoUrl);
  if (remoteLogo) {
    doc.image(remoteLogo, margin, 22, { width: 40, height: 40 });
  } else if (fs.existsSync(branding.logoPath)) {
    doc.image(branding.logoPath, margin, 22, { width: 40, height: 40 });
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(branding.hospitalName, margin + 50, 20);
  doc.font("Helvetica").fontSize(12).text("Sample Letterhead", margin + 50, 45);

  doc
    .fontSize(10)
    .text(`Regd. No.: ${branding.regNo}`, pageWidth - margin - 170, 16, {
      width: 170,
      align: "right",
    });
  doc
    .fontSize(9)
    .text(branding.phone, pageWidth - margin - 170, 36, {
      width: 170,
      align: "right",
    });
  doc
    .text(branding.email, pageWidth - margin - 170, 50, {
      width: 170,
      align: "right",
    });
  doc
    .text(branding.website, pageWidth - margin - 170, 64, {
      width: 170,
      align: "right",
    });

  doc.fillColor(textDark);
  doc.moveDown();

  const patientUser = labOrder?.patientUserId || {};
  const patientProfile = labOrder?.patientId || {};
  const doctorUser = labOrder?.doctorId?.userId || {};

  const infoTop = 110;
  const infoHeight = 64;

  // Patient info box
  doc.rect(margin, infoTop, contentWidth * 0.55, infoHeight).stroke(border);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(patientUser.name || "Patient", margin + 8, infoTop + 8);
  doc.font("Helvetica").fontSize(9).fillColor(textMuted);
  doc.text(
    `Age / Sex : ${calcAge(patientProfile.dateOfBirth || patientUser.dob)} / ${
      patientUser.gender || "—"
    }`,
    margin + 8,
    infoTop + 26
  );
  doc.text(
    `Referred by : ${doctorUser.name || "Self"}`,
    margin + 8,
    infoTop + 40
  );
  doc.text(`Reg. no. : ${patientUser.patientId || "—"}`, margin + 8, infoTop + 54);
  doc.fillColor(textDark);

  // Barcode block
  const midLeft = margin + contentWidth * 0.55;
  const midWidth = contentWidth * 0.25;
  doc.rect(midLeft, infoTop, midWidth, infoHeight).stroke(border);
  if (barcodeBuffer) {
    doc.image(barcodeBuffer, midLeft + 6, infoTop + 8, {
      width: midWidth - 12,
      height: 30,
    });
  }
  doc.font("Helvetica").fontSize(9).text(barcodeValue, midLeft + 10, infoTop + 42);
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(`Registered on : ${formatDateTime(labOrder?.createdAt)}`, midLeft + 10, infoTop + 56);

  // QR block
  const qrLeft = midLeft + midWidth;
  const qrWidth = contentWidth * 0.2;
  doc.rect(qrLeft, infoTop, qrWidth, infoHeight).stroke(border);
  doc.font("Helvetica").fontSize(8).text("Scan to download", qrLeft + 8, infoTop + 8);
  if (qrBuffer) {
    doc.image(qrBuffer, qrLeft + 10, infoTop + 22, {
      width: qrWidth - 20,
      height: 40,
    });
  } else {
    doc.rect(qrLeft + 10, infoTop + 24, qrWidth - 20, 34).stroke(border);
  }

  // Collection timestamps
  doc.font("Helvetica").fontSize(9).fillColor(textMuted);
  doc.text(
    `Collected on : ${formatDate(labOrder?.sampleCollectedAt || labOrder?.sampleCollectionAt)}`,
    midLeft + 10,
    infoTop + 70
  );
  doc.text(
    `Reported on : ${formatDateTime(report?.createdAt || labOrder?.reportReadyAt)}`,
    qrLeft + 8,
    infoTop + 70
  );
  doc.fillColor(textDark);

  // Section title
  doc
    .moveTo(margin, infoTop + infoHeight + 14)
    .lineTo(pageWidth - margin, infoTop + infoHeight + 14)
    .stroke(border);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text((report?.reportType || "LAB").toUpperCase(), margin, infoTop + infoHeight + 22, {
      align: "center",
      width: contentWidth,
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text((report?.reportName || "Diagnostic Report").toUpperCase(), margin, infoTop + infoHeight + 38, {
      align: "center",
      width: contentWidth,
    });

  // Results table with pagination
  const tableTop = infoTop + infoHeight + 60;
  const headerMeta = drawResultsHeader(doc, margin, contentWidth, tableTop, border);
  const rowHeight = headerMeta.rowHeight;
  const colWidths = headerMeta.colWidths;
  let y = headerMeta.nextY;
  doc.fillColor(textDark).font("Helvetica").fontSize(9);

  const ensureSpace = () => {
    if (y + rowHeight > doc.page.height - margin - 120) {
      doc.addPage();
      const headerTop = margin;
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text((report?.reportType || "LAB").toUpperCase(), margin, headerTop, {
          align: "center",
          width: contentWidth,
        });
      const meta = drawResultsHeader(doc, margin, contentWidth, headerTop + 16, border);
      y = meta.nextY;
      doc.font("Helvetica").fontSize(9);
    }
  };

  if (items.length === 0) {
    doc.rect(margin, y, contentWidth, rowHeight).stroke(border);
    doc.text("No test results available.", margin + 8, y + 6);
    y += rowHeight;
  } else {
    items.forEach((item) => {
      ensureSpace();
      doc.rect(margin, y, contentWidth, rowHeight).stroke(border);
      let cx = margin + 6;
      const value = item.resultValue || "—";
      const unit = item.resultUnit || "—";
      const reference = item.referenceRange || "—";
      doc.text(item.testName || "Test", cx, y + 6, { width: colWidths[0] - 12 });
      cx += colWidths[0];
      doc.text(value, cx, y + 6, { width: colWidths[1] - 12 });
      cx += colWidths[1];
      doc.text(unit, cx, y + 6, { width: colWidths[2] - 12 });
      cx += colWidths[2];
      doc.text(reference, cx, y + 6, { width: colWidths[3] - 12 });
      y += rowHeight;
    });
  }

  // Clinical notes block
  let notesTop = y + 16;
  if (notesTop + 90 > doc.page.height - margin - 80) {
    doc.addPage();
    notesTop = margin + 16;
  }
  doc.rect(margin, notesTop, contentWidth, 70).fill("#f3f4f6");
  doc
    .fillColor(textDark)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Clinical Notes:", margin + 8, notesTop + 8);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(textMuted)
    .text(labOrder?.notes || "No additional notes provided.", margin + 8, notesTop + 22, {
      width: contentWidth - 16,
    });
  doc.fillColor(textDark);

  // Footer signatures
  const footerTop = notesTop + 90;
  doc.font("Helvetica").fontSize(9).text("Lab Incharge", margin, footerTop);
  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Pathologist", pageWidth - margin - 100, footerTop, {
      width: 100,
      align: "right",
    });

  doc
    .fontSize(8)
    .fillColor(textMuted)
    .text("System generated report. Not valid for medico legal purpose.", margin, footerTop + 24, {
      align: "center",
      width: contentWidth,
    });
  doc.fillColor(textDark);

  doc.end();
};
