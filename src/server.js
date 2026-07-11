const express = require("express");
const apiRoutes = require("./routes/api");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());
app.use("/", apiRoutes);

app.get("/", (req, res) => {
  res.send(`
    <h1>?? SR Group API</h1>
    <p>API is running! Use these endpoints:</p>
    <ul>
      <li><a href="/api/dashboard">/api/dashboard</a></li>
      <li><a href="/api/skills">/api/skills</a></li>
      <li><a href="/api/projects">/api/projects</a></li>
      <li><a href="/api/goals">/api/goals</a></li>
    </ul>
  `);
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
