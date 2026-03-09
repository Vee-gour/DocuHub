const express = require("express");
const mongoose = require("mongoose");
const { isCloudinaryConfigured } = require("../services/storageService");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", app: "DocuHub" });
});

router.get("/storage", (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  const cloudinaryConfigured = isCloudinaryConfigured();

  res.json({
    status: mongoConnected ? "ok" : "degraded",
    storage: {
      mongodb: {
        connected: mongoConnected,
        readyState: mongoose.connection.readyState
      },
      cloudinary: {
        configured: cloudinaryConfigured
      }
    }
  });
});

module.exports = router;
