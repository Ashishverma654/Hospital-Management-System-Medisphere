import PDFDocument from "pdfkit";

export const generateLabOrderPDF = (res, labOrder, items = []) => {
  const doc = new PDFDocument({
    margin: 40,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=lab-order-${labOrder._id}.pdf`
  );

  doc.pipe(res);

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text("LAB ORDER FORM", {
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
