const router = require("express").Router();
const Item = require("../models/Item");
const Booking = require("../models/Booking");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;

// Student: reserve an item (atomic, so two students can't grab the same one)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await Item.findOneAndUpdate(
      { _id: itemId, status: "available" },
      { $set: { status: "reserved" } },
      { new: true }
    );
    if (!item) return res.status(409).json({ error: "Item is not available" });

    const booking = await Booking.create({
      prn: req.user.prn,
      item: item._id,
      pickupBy: new Date(Date.now() + 24 * HOURS),
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student: my bookings
router.get("/me", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ prn: req.user.prn })
      .populate("item").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: all bookings
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("item").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: mark picked up (item handed to student, due in 7 days)
router.patch("/:id/pickup", requireAuth, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: "reserved" },
      { $set: { status: "checked_out", dueDate: new Date(Date.now() + 7 * DAYS) } },
      { new: true }
    );
    if (!booking) return res.status(409).json({ error: "Booking is not in reserved state" });
    await Item.findByIdAndUpdate(booking.item, { status: "checked_out" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: mark returned (condition: "good" or "damaged")
router.patch("/:id/return", requireAuth, requireAdmin, async (req, res) => {
  try {
    const condition = req.body.condition === "damaged" ? "damaged" : "good";
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: "checked_out" },
      { $set: { status: "returned", returnedAt: new Date(), condition } },
      { new: true }
    );
    if (!booking) return res.status(409).json({ error: "Booking is not checked out" });
    await Item.findByIdAndUpdate(booking.item, {
      status: condition === "damaged" ? "maintenance" : "available",
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
