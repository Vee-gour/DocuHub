const path = require("path");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

async function uploadPdfToCloudinary(localPath, originalName) {
  const baseName = path.parse(originalName || "document.pdf").name;
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");

  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: "raw",
    folder: "docuhub/pdfs",
    public_id: `${Date.now()}-${safeName}`
  });

  return {
    url: result.secure_url,
    publicId: result.public_id
  };
}

async function deleteCloudinaryAsset(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

module.exports = {
  isCloudinaryConfigured,
  uploadPdfToCloudinary,
  deleteCloudinaryAsset
};
