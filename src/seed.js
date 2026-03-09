require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Category = require("./models/Category");
const Document = require("./models/Document");

async function runSeed() {
  try {
    await connectDB();

    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { username },
      { username, passwordHash, role: "admin" },
      { upsert: true, new: true }
    );

    const categoryNames = [
      { name: "Policies", description: "Company policy documents" },
      { name: "Guides", description: "How-to guides and handbooks" },
      { name: "Reports", description: "Financial and operational reports" },
      { name: "Legal", description: "Contracts and legal references" }
    ];

    const categories = [];
    for (const item of categoryNames) {
      const category = await Category.findOneAndUpdate({ name: item.name }, item, {
        upsert: true,
        new: true
      });
      categories.push(category);
    }

    if ((await Document.countDocuments()) === 0) {
      await Document.insertMany([
        {
          title: "Sample Employee Handbook",
          description: "A sample handbook PDF from an external source.",
          category: categories[1]._id,
          externalUrl:
            "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        },
        {
          title: "Quarterly Metrics Template",
          description: "Template report for metrics sharing.",
          category: categories[2]._id,
          externalUrl:
            "https://www.orimi.com/pdf-test.pdf"
        }
      ]);
    }

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

runSeed();
