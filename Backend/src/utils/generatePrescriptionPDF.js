import PDFDocument from "pdfkit";

export const generatePrescriptionPDF = (res, prescription) => {

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=prescription-${prescription._id}.pdf`
    );

    doc.pipe(res);

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