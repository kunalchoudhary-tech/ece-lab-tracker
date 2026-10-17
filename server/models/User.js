const mongoose = require("mongoose");

module.exports = mongoose.model("User", new mongoose.Schema({
  prn: { type: String, required: true, unique: true },
  name: String,
  passwordHash: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
}, { timestamps: true }));
