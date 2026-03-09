const express = require("express");
const {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
} = require("../controllers/documentController");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listDocuments);
router.get("/:id", getDocument);
router.post("/", requireAuth, upload.single("pdf"), createDocument);
router.put("/:id", requireAuth, upload.single("pdf"), updateDocument);
router.delete("/:id", requireAuth, deleteDocument);

module.exports = router;
