import express from "express";
import db from "../database/db.js";

const router = express.Router();


// ---------------- GET ALL COMPANIES ----------------
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM companies");
    res.json(rows);
  } catch (error) {
    console.error("Companies fetch error:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});


// ---------------- GET SAVED COMPANIES ----------------
// IMPORTANT: place before /:id routes
router.get("/saved", async (req, res) => {
  try {
    const userId = 1; // TEMP test user

    const [rows] = await db.query(
      `SELECT c.*
       FROM saved_companies sc
       JOIN companies c ON sc.company_id = c.id
       WHERE sc.user_id = ?`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Saved companies error:", error);
    res.status(500).json({ error: "Failed to fetch saved companies" });
  }
});


// ---------------- GET COMPANY CULTURE ----------------
router.get("/:id/culture", async (req, res) => {
  try {
    const companyId = req.params.id;

    const [culture] = await db.query(
      "SELECT * FROM company_culture WHERE company_id=?",
      [companyId]
    );

    if (culture.length === 0) {
      return res.status(404).json({ message: "No culture data found" });
    }

    res.json(culture[0]);

  } catch (error) {
    console.error("Culture fetch error:", error);
    res.status(500).json({ error: "Failed to fetch company culture" });
  }
});


// ---------------- GET COMPANY ATTRIBUTES ----------------
router.get("/:id/attributes", async (req, res) => {
  try {
    const companyId = req.params.id;

    const [rows] = await db.query(
      "SELECT attribute_category, attribute_name FROM culture_attributes WHERE company_id=?",
      [companyId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Attributes fetch error:", error);
    res.status(500).json({ error: "Failed to fetch attributes" });
  }
});


// ---------------- GET COMPANY BENEFITS ----------------
router.get("/:id/benefits", async (req, res) => {
  try {
    const companyId = req.params.id;

    const [rows] = await db.query(
      "SELECT benefit_category, benefit_name, benefit_description FROM company_benefits WHERE company_id=?",
      [companyId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Benefits fetch error:", error);
    res.status(500).json({ error: "Failed to fetch company benefits" });
  }
});


// ---------------- GET COMPANY REVIEWS ----------------
router.get("/:id/reviews", async (req, res) => {
  try {
    const companyId = req.params.id;

    const [rows] = await db.query(
      `SELECT 
        id,
        overall_rating,
        job_title,
        location,
        pros,
        cons,
        work_life_balance_rating,
        culture_values_rating,
        career_opportunities_rating,
        compensation_benefits_rating,
        senior_management_rating,
        helpful_count,
        not_helpful_count,
        created_at
       FROM employee_reviews
       WHERE company_id = ? AND is_approved = true`,
      [companyId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Reviews fetch error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});


// ---------------- GET COMPANY VALUES ----------------
router.get("/:id/values", async (req, res) => {
  try {
    const companyId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM company_values WHERE company_id = ? ORDER BY display_order",
      [companyId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Values fetch error:", error);
    res.status(500).json({ error: "Failed to fetch company values" });
  }
});






export default router;
