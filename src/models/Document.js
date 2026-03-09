const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    originalFileName: { type: String, default: "" },
    fileName: { type: String, default: "" },
    filePath: { type: String, default: "" },
    mimeType: { type: String, default: "application/pdf" },
    fileSize: { type: Number, default: 0 },
    externalUrl: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
    htmlContent: { type: String, default: "" },
    convertToHtml: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
