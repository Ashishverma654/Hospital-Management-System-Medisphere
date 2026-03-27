import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bwipjs from "bwip-js";
import http from "http";
import https from "https";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");
const formatTime = (value) => (value ? new Date(value).toLocaleTimeString() : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "—");
const calcAge = (dob) => {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};
const sumPayments = (history = []) =>
  Array.isArray(history) ? history.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) : 0;

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

export const generateInvoicePDF = async (res, invoice, settings = {}) => {
  const doc = new PDFDocument({ margin: 28, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice._id}.pdf`);
  doc.pipe(res);

  const branding = resolveBranding(settings);
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin - doc.page.margins.right;

  const textDark = "#111827";
  const border = "#1f2937";
  const lightBorder = "#d1d5db";

  const patientUser = invoice.patientId?.userId || invoice.patientUserId;
  const patientProfile = invoice.patientId || {};
  const doctorName = invoice.appointmentId?.doctorId?.userId?.name || "N/A";
  const wardName = invoice.wardId?.name || "—";
  const bedNumber = invoice.bedId?.bedNumber || "—";

  const discountAmount = Number(invoice.discount?.amount || 0);
  const grossAmount = Number(invoice.subtotal || invoice.totalAmount || 0);
  const paidAmount = sumPayments(invoice.paymentHistory) || (invoice.paymentStatus === "paid" ? grossAmount : 0);
  const netAmount = Math.max(0, grossAmount - discountAmount);
  const balanceAmount = Math.max(0, netAmount - paidAmount);
  const refundableAmount = Math.max(0, paidAmount - netAmount);

  const barcodeValue = invoice.invoiceNumber || invoice._id?.toString() || "INV";
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

  // Header
  const remoteLogo = await fetchImageBuffer(branding.logoUrl);
  if (remoteLogo) {
    doc.image(remoteLogo, margin, 20, { width: 42, height: 42 });
  } else if (fs.existsSync(branding.logoPath)) {
    doc.image(branding.logoPath, margin, 20, { width: 42, height: 42 });
  }
  doc.font("Helvetica-Bold").fontSize(20).fillColor(textDark).text(branding.hospitalName, margin + 52, 22);
  doc.font("Helvetica").fontSize(9).text(branding.address, margin + 52, 44);
  doc.text(`Ph: ${branding.phone}`, margin + 52, 56);
  doc.text(`${branding.email} • ${branding.website}`, margin + 52, 68);
  doc.font("Helvetica-Bold").fontSize(12).text("Hospital Final Bill", margin, 86, { align: "center", width: contentWidth });

  if (barcodeBuffer) {
    doc.image(barcodeBuffer, pageWidth - margin - 160, 90, { width: 150, height: 30 });
  }

  // Secondary barcode for lab/pharmacy reference
  const labRef = invoice.labOrderId?.orderNumber || invoice.labOrderId?._id;
  const pharmacyRef = invoice.pharmacyOrderId?._id;
  const secondaryRef = invoice.billType === "lab" ? labRef : invoice.billType === "pharmacy" ? pharmacyRef : null;
  if (secondaryRef) {
    try {
      const secondaryBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(secondaryRef),
        scale: 2,
        height: 8,
        includetext: false,
      });
      doc.font("Helvetica").fontSize(8).text(
        invoice.billType === "lab" ? "Lab Order Ref" : "Pharmacy Order Ref",
        pageWidth - margin - 160,
        122,
        { width: 150, align: "center" }
      );
      doc.image(secondaryBuffer, pageWidth - margin - 160, 134, { width: 150, height: 24 });
    } catch {
      // ignore barcode failures
    }
  }

  const billTop = 110;
  doc.moveTo(margin, billTop).lineTo(pageWidth - margin, billTop).stroke(border);

  const leftColX = margin;
  const rightColX = margin + contentWidth * 0.55;
  const lineGap = 14;
  let cursorY = billTop + 10;

  const leftFields = [
    ["IPNO", patientUser?.patientId || "—"],
    ["UHID", patientUser?.patientId || "—"],
    ["Bill No", invoice.invoiceNumber || invoice._id],
    ["Patient Name", patientUser?.name || "—"],
    ["Age & Sex", `${calcAge(patientProfile.dateOfBirth || patientUser?.dob)} / ${patientUser?.gender || "—"}`],
    ["Relation Name", "—"],
    ["Room/Bed No", bedNumber !== "—" ? `${wardName} / ${bedNumber}` : wardName],
    ["Doc/Specialization", doctorName],
  ];

  const rightFields = [
    ["Bill Date", formatDate(invoice.createdAt)],
    ["Bill Time", formatTime(invoice.createdAt)],
    ["Admission Date", formatDate(invoice.bedId?.admittedAt)],
    ["Admission Time", formatTime(invoice.bedId?.admittedAt)],
    ["Discharge Date", formatDate(invoice.bedId?.dischargedAt)],
    ["Discharge Time", formatTime(invoice.bedId?.dischargedAt)],
    ["Patient Category", invoice.paymentStatus?.toUpperCase() || "PAYMENT"],
  ];

  doc.font("Helvetica").fontSize(9);
  leftFields.forEach(([label, value]) => {
    doc.text(`${label}`, leftColX, cursorY, { width: 110 });
    doc.text(`: ${value}`, leftColX + 120, cursorY);
    cursorY += lineGap;
  });

  cursorY = billTop + 10;
  rightFields.forEach(([label, value]) => {
    doc.text(`${label}`, rightColX, cursorY, { width: 110 });
    doc.text(`: ${value}`, rightColX + 120, cursorY);
    cursorY += lineGap;
  });

  const tableTop = billTop + 130;
  doc.moveTo(margin, tableTop).lineTo(pageWidth - margin, tableTop).stroke(border);

  const headers = ["Service name", "Rate", "Count", "TotalAmt", "DiscAmt", "NetAmt"];
  const colWidths = [
    contentWidth * 0.38,
    contentWidth * 0.12,
    contentWidth * 0.1,
    contentWidth * 0.14,
    contentWidth * 0.12,
    contentWidth * 0.14,
  ];
  const headerHeight = 18;
  doc.font("Helvetica-Bold").fontSize(9);
  let x = margin + 4;
  headers.forEach((header, idx) => {
    doc.text(header, x, tableTop + 4, { width: colWidths[idx] - 8 });
    x += colWidths[idx];
  });
  doc.moveTo(margin, tableTop + headerHeight).lineTo(pageWidth - margin, tableTop + headerHeight).stroke(lightBorder);

  let y = tableTop + headerHeight + 4;
  doc.font("Helvetica").fontSize(9);

  const lineItems = Array.isArray(invoice.lineItems) && invoice.lineItems.length ? invoice.lineItems : [];
  if (!lineItems.length) {
    doc.text("No billable services recorded.", margin + 4, y + 2);
    y += 20;
  } else {
    lineItems.forEach((item) => {
      const qty = Number(item.quantity || 1);
      const rate = Number(item.unitPrice || 0);
      const total = Number(item.lineTotal ?? qty * rate);
      const discount = 0;
      const net = total - discount;

      let colX = margin + 4;
      doc.text(item.label || "Service", colX, y, { width: colWidths[0] - 8 });
      colX += colWidths[0];
      doc.text(rate.toFixed(2), colX, y, { width: colWidths[1] - 8, align: "right" });
      colX += colWidths[1];
      doc.text(qty, colX, y, { width: colWidths[2] - 8, align: "right" });
      colX += colWidths[2];
      doc.text(total.toFixed(2), colX, y, { width: colWidths[3] - 8, align: "right" });
      colX += colWidths[3];
      doc.text(discount.toFixed(2), colX, y, { width: colWidths[4] - 8, align: "right" });
      colX += colWidths[4];
      doc.text(net.toFixed(2), colX, y, { width: colWidths[5] - 8, align: "right" });
      y += 16;
    });
  }

  const totalsTop = y + 10;
  doc.moveTo(margin, totalsTop).lineTo(pageWidth - margin, totalsTop).stroke(lightBorder);

  const totalsX = pageWidth - margin - 180;
  const totalsLine = (label, value, offset) => {
    doc.text(label, totalsX, totalsTop + offset, { width: 110 });
    doc.text(`: ${value}`, totalsX + 110, totalsTop + offset, { width: 70, align: "right" });
  };

  doc.font("Helvetica").fontSize(9);
  totalsLine("Gross Amount", grossAmount.toFixed(2), 6);
  totalsLine("Net Amount", netAmount.toFixed(2), 20);
  totalsLine("Total Advance", paidAmount.toFixed(2), 34);
  totalsLine("Paid Amount", paidAmount.toFixed(2), 48);
  totalsLine("Balance Amount", balanceAmount.toFixed(2), 62);
  totalsLine("Refundable Amt", refundableAmount.toFixed(2), 76);

  // Receipts table
  const receiptTop = totalsTop + 110;
  doc.font("Helvetica-Bold").fontSize(9).text("Receipts Details:", margin, receiptTop);
  doc.font("Helvetica-Bold").fontSize(8);
  doc.text("Sno", margin, receiptTop + 14);
  doc.text("Tran.Type", margin + 30, receiptTop + 14);
  doc.text("TranDate", margin + 110, receiptTop + 14);
  doc.text("Billno", margin + 200, receiptTop + 14);
  doc.text("Paid Amt", margin + 260, receiptTop + 14);

  doc.font("Helvetica").fontSize(8);
  if (invoice.paymentHistory?.length) {
    invoice.paymentHistory.forEach((entry, idx) => {
      const rowY = receiptTop + 28 + idx * 12;
      doc.text(String(idx + 1), margin, rowY);
      doc.text(entry.method || "payment", margin + 30, rowY);
      doc.text(formatDate(entry.paidAt), margin + 110, rowY);
      doc.text(invoice.invoiceNumber || invoice._id, margin + 200, rowY);
      doc.text(Number(entry.amount || 0).toFixed(2), margin + 260, rowY);
    });
  } else {
    doc.text("No receipts recorded.", margin, receiptTop + 28);
  }

  const footerTop = doc.page.height - 80;
  doc.moveTo(margin, footerTop).lineTo(pageWidth - margin, footerTop).stroke(lightBorder);
  doc.font("Helvetica").fontSize(9).text("Prepared By: System", margin, footerTop + 12);
  doc.text("Authorised Signature", pageWidth - margin - 140, footerTop + 12, { width: 140, align: "right" });
  doc.font("Helvetica").fontSize(8).text(`Generated on ${formatDateTime(new Date())}`, margin, footerTop + 32);

  doc.end();
};
