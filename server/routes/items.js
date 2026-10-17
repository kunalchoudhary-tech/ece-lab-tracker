const router = require("express").Router();
const Item = require("../models/Item");

router.get("/", async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.name = new RegExp(search, "i");
    const items = await Item.find(filter).sort({ assetTag: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
