const mongoose = require("mongoose");
const app = require("../src/app");
const connectDB = require("../src/config/db");

let connectionPromise = null;

async function ensureDb() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  await connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDb();
    return app(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Database connection failed" }));
  }
};
