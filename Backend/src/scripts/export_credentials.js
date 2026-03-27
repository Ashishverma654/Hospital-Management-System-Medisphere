import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import * as XLSX from "xlsx";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required.");
  process.exit(1);
}

const passwordForRole = (role) => (role === "superadmin" ? "SuperAdmin@123" : "Password@123");

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toSpreadsheetXml = (rows) => {
  const header = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Credentials">
    <Table>
`;

  const footer = `
    </Table>
  </Worksheet>
</Workbook>`;

  const buildRow = (cells) =>
    `      <Row>\n${cells
      .map((cell) => `        <Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
      .join("\n")}\n      </Row>\n`;

  const body = rows.map((row) => buildRow(row)).join("");
  return header + body + footer;
};

const exportCredentials = async () => {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({})
    .select("name email role")
    .sort({ role: 1, name: 1, email: 1 });

  const rows = [
    ["Role", "Name", "Email", "Password"],
    ...users.map((user) => [
      user.role,
      user.name,
      user.email,
      passwordForRole(user.role),
    ]),
  ];

  const csvLines = rows.map((row) =>
    row
      .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csvContent = csvLines.join("\n");

  const xmlContent = toSpreadsheetXml(rows);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");

  const cwd = process.cwd();
  const outDir = cwd.endsWith("Backend") ? path.resolve(cwd, "..") : cwd;
  const csvPath = path.join(outDir, "credentials.csv");
  const xmlPath = path.join(outDir, "credentials.xml");
  const xlsxPath = path.join(outDir, "credentials.xlsx");

  fs.writeFileSync(csvPath, csvContent, "utf8");
  fs.writeFileSync(xmlPath, xmlContent, "utf8");
  XLSX.writeFile(workbook, xlsxPath);

  console.log("Export complete:");
  console.log(csvPath);
  console.log(xmlPath);
  console.log(xlsxPath);

  await mongoose.disconnect();
};

exportCredentials().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
