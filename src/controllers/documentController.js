const fs = require("fs");
const path = require("path");
const Category = require("../models/Category");
const Document = require("../models/Document");
const { convertPdfToHtml } = require("../utils/pdfConverter");
const {
  isCloudinaryConfigured,
  uploadPdfToCloudinary,
  deleteCloudinaryAsset
} = require("../services/storageService");

function buildDownloadUrl(doc) {
  if (doc.externalUrl) return doc.externalUrl;
  if (doc.filePath) return `/${doc.filePath.replace(/\\/g, "/")}`;
  return "";
}

function parseBoolean(value, defaultValue = false) {
  if (Array.isArray(value)) {
    return parseBoolean(value[value.length - 1], defaultValue);
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return defaultValue;
}

function removeLocalFile(filePath) {
  if (!filePath) return;
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
}

async function listDocuments(req, res, next) {
  try {
    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Math.min(Number.parseInt(req.query.limit || "10", 10), 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const category = req.query.category || "";

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(filter)
    ]);

    return res.json({
      data: documents.map((doc) => ({
        ...doc.toObject(),
        downloadUrl: buildDownloadUrl(doc)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getDocument(req, res, next) {
  try {
    const document = await Document.findById(req.params.id).populate("category");
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.json({
      ...document.toObject(),
      downloadUrl: buildDownloadUrl(document)
    });
  } catch (error) {
    return next(error);
  }
}

async function createDocument(req, res, next) {
  try {
    const { title, description = "", categoryId, externalUrl = "", convertToHtml = "false" } = req.body;
    if (!title || !categoryId) {
      return res.status(400).json({ message: "Title and categoryId are required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    if (!req.file && !externalUrl) {
      return res.status(400).json({ message: "Upload a PDF file or provide an externalUrl" });
    }

    const shouldConvert = parseBoolean(convertToHtml, false);
    let htmlContent = "";
    let uploadedUrl = req.file ? "" : externalUrl;
    let cloudinaryPublicId = "";
    let localFilePath = req.file ? path.join("uploads", req.file.filename) : "";

    if (req.file && shouldConvert) {
      htmlContent = await convertPdfToHtml(req.file.path);
    }

    if (req.file && isCloudinaryConfigured()) {
      const cloudinaryResult = await uploadPdfToCloudinary(req.file.path, req.file.originalname);
      uploadedUrl = cloudinaryResult.url;
      cloudinaryPublicId = cloudinaryResult.publicId;
      removeLocalFile(req.file.path);
      localFilePath = "";
    }

    const doc = await Document.create({
      title,
      description,
      category: categoryId,
      originalFileName: req.file ? req.file.originalname : "",
      fileName: req.file ? req.file.filename : "",
      filePath: localFilePath,
      mimeType: req.file ? req.file.mimetype : "application/pdf",
      fileSize: req.file ? req.file.size : 0,
      externalUrl: uploadedUrl,
      cloudinaryPublicId,
      convertToHtml: shouldConvert,
      htmlContent
    });

    return res.status(201).json(doc);
  } catch (error) {
    return next(error);
  }
}

async function updateDocument(req, res, next) {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const { title, description, categoryId, externalUrl, convertToHtml } = req.body;
    const shouldConvert = parseBoolean(
      typeof convertToHtml !== "undefined" ? convertToHtml : document.convertToHtml,
      Boolean(document.convertToHtml)
    );
    let uploadedHtmlContent = "";

    if (title) document.title = title;
    if (typeof description === "string") document.description = description;
    if (typeof externalUrl === "string") document.externalUrl = externalUrl;

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid categoryId" });
      }
      document.category = categoryId;
    }

    if (req.file) {
      if (shouldConvert) {
        uploadedHtmlContent = await convertPdfToHtml(req.file.path);
      }

      if (document.cloudinaryPublicId) {
        await deleteCloudinaryAsset(document.cloudinaryPublicId);
      }
      removeLocalFile(document.filePath);

      document.originalFileName = req.file.originalname;
      document.fileName = req.file.filename;
      document.filePath = path.join("uploads", req.file.filename);
      document.mimeType = req.file.mimetype;
      document.fileSize = req.file.size;
      document.cloudinaryPublicId = "";
      document.externalUrl = "";

      if (isCloudinaryConfigured()) {
        const cloudinaryResult = await uploadPdfToCloudinary(req.file.path, req.file.originalname);
        document.externalUrl = cloudinaryResult.url;
        document.cloudinaryPublicId = cloudinaryResult.publicId;
        document.filePath = "";
        removeLocalFile(req.file.path);
      }
    }

    document.convertToHtml = shouldConvert;

    if (shouldConvert && req.file) {
      document.htmlContent = uploadedHtmlContent || document.htmlContent;
    } else if (shouldConvert && !document.htmlContent && document.filePath) {
      const absolutePath = path.join(process.cwd(), document.filePath);
      document.htmlContent = await convertPdfToHtml(absolutePath);
    } else if (!shouldConvert) {
      document.htmlContent = "";
    }

    await document.save();
    return res.json(document);
  } catch (error) {
    return next(error);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const document = await Document.findByIdAndDelete(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.cloudinaryPublicId) {
      await deleteCloudinaryAsset(document.cloudinaryPublicId);
    }
    removeLocalFile(document.filePath);

    return res.json({ message: "Document deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
};
