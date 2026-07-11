const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/api");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// JSON Middleware
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// ????????? ???? (HTML, CSS, JS) ????? ???
app.use(express.static(path.join(__dirname, "../public")));

// ???? ???? ?????????? index.html-? ??????
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
