const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const PRN_FORMAT = /^\d{10}$/;

const makeToken = (user) =>
  jwt.sign({ prn: user.prn, role: user.role, name: user.name },
    process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req, res) => {
  try {
    const { prn, name, password } = req.body;
    if (!PRN_FORMAT.test(prn || "")) return res.status(400).json({ error: "PRN must be 10 digits" });
    if (!name || !password || password.length < 6)
      return res.status(400).json({ error: "Name and a password of 6+ characters required" });
    if (await User.findOne({ prn })) return res.status(409).json({ error: "PRN already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ prn, name, passwordHash, role: "student" });
    res.status(201).json({ token: makeToken(user), user: { prn: user.prn, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { prn, password } = req.body;
    const user = await User.findOne({ prn });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res.status(401).json({ error: "Wrong PRN or password" });
    res.json({ token: makeToken(user), user: { prn: user.prn, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, (req, res) => res.json(req.user));

module.exports = router;
