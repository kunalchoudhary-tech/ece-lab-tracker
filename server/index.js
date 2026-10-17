require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("ECE Lab Tracker API running"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/bookings", require("./routes/bookings"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5001, () =>
      console.log(`Server on http://localhost:${process.env.PORT || 5001}`));
  })
  .catch((err) => console.error("DB connection failed:", err.message));
