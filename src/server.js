const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/api");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());
app.use("/api", apiRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
