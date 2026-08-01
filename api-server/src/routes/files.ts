import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

async function extractText(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const ext = originalname.split(".").pop()?.toLowerCase() ?? "";

  if (mimetype === "application/pdf" || ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimetype === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheets = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      return `--- Sheet: ${name} ---\n${XLSX.utils.sheet_to_csv(ws)}`;
    });
    return sheets.join("\n\n").trim();
  }

  if (ext === "csv" || mimetype === "text/csv") {
    return buffer.toString("utf-8").trim();
  }

  if (
    mimetype.startsWith("text/") ||
    ext === "txt" ||
    ext === "md" ||
    ext === "json" ||
    ext === "xml" ||
    ext === "html"
  ) {
    return buffer.toString("utf-8").trim();
  }

  if (mimetype.startsWith("image/")) {
    return `[Image uploaded: ${originalname}. Please describe what you need Gadus to do with this image.]`;
  }

  return buffer.toString("utf-8").trim();
}

router.post("/files/analyze", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const { buffer, mimetype, originalname, size } = req.file;
    const text = await extractText(buffer, mimetype, originalname);
    const truncated = text.length > 40000 ? text.slice(0, 40000) + "\n\n[Content truncated — file is very long]" : text;
    res.json({
      filename: originalname,
      size,
      mimetype,
      content: truncated,
      charCount: text.length,
    });
  } catch (err) {
    req.log.error({ err }, "File analysis failed");
    res.status(500).json({ error: "Failed to analyze file" });
  }
});

export default router;
