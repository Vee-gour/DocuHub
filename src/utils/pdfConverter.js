const fs = require("fs");
const pdfParse = require("pdf-parse");

function paragraphsFromText(text) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${chunk.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("\n");
}

async function convertPdfToHtml(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(fileBuffer);
  const content = paragraphsFromText(parsed.text || "");
  return content || "<p>No extractable text found in this PDF.</p>";
}

module.exports = { convertPdfToHtml };
