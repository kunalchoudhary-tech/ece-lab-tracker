const mongoose = require("mongoose");

module.exports = mongoose.model("Booking", new mongoose.Schema({
  prn: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  status: { type: String, default: "reserved",
    enum: ["reserved", "checked_out", "returned", "expired", "overdue"] },
  reservedAt: { type: Date, default: Date.now },
  pickupBy: Date,
  dueDate: Date,
  returnedAt: Date,
  condition: String,
}, { timestamps: true }));
