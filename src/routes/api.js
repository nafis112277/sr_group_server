const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/api/skills", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM skills ORDER BY skill_name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/dashboard", async (req, res) => {
  try {
    const [skills, projects, goals] = await Promise.all([
      pool.query("SELECT COUNT(*) as total FROM skills"),
      pool.query("SELECT COUNT(*) as total FROM projects WHERE status = $1", ["active"]),
      pool.query("SELECT COUNT(*) as total FROM goals WHERE status = $1", ["active"])
    ]);
    
    res.json({
      total_skills: parseInt(skills.rows[0].total),
      active_projects: parseInt(projects.rows[0].total),
      active_goals: parseInt(goals.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
