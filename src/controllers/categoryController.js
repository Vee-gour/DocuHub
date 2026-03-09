const Category = require("../models/Category");
const Document = require("../models/Document");

async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    return next(error);
  }
}

async function categorySummary(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    const counts = await Document.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
    const summary = categories.map((category) => ({
      ...category,
      documentCount: countMap.get(String(category._id)) || 0
    }));

    return res.json(summary);
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description = "" } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, description });
    return res.status(201).json(category);
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) category.name = name;
    if (typeof description === "string") category.description = description;
    await category.save();
    return res.json(category);
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const docCount = await Document.countDocuments({ category: id });
    if (docCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete category that still has documents" });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json({ message: "Category deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  categorySummary,
  createCategory,
  updateCategory,
  deleteCategory
};
