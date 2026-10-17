const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ["fpga", "automobile_sensor", "microcontroller"] },
  status: { type: String, default: "available",
    enum: ["available", "reserved", "checked_out", "maintenance"] },
  specs: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
