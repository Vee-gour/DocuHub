const express = require("express");
const {
  listCategories,
  categorySummary,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listCategories);
router.get("/summary", categorySummary);
router.post("/", requireAuth, createCategory);
router.put("/:id", requireAuth, updateCategory);
router.delete("/:id", requireAuth, deleteCategory);

module.exports = router;
