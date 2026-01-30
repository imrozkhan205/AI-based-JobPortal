import express from "express";
import db from "../database/db.js";

const router = express.Router();


// GET all companies
router.get("/", async (req, res) => {
  try {

    const sql = "SELECT * FROM companies";
    const [rows] = await db.query(sql);

    res.json(rows);

  } catch (error) {
    console.error("Companies fetch error:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});


// GET company culture by company id
router.get("/:id/culture", async (req, res) => {

  try {

    const companyId = req.params.id;

    // Basic validation
    if (!companyId) {
      return res.status(400).json({ error: "Company ID required" });
    }

    const [culture] = await db.query(
      "SELECT * FROM company_culture WHERE company_id=?",
      [companyId]
    );

    // If no culture data exists
    if (culture.length === 0) {
      return res.status(404).json({ message: "No culture data found" });
    }

    res.json(culture[0]);

  } catch (error) {
    console.error("Culture fetch error:", error);
    res.status(500).json({ error: "Failed to fetch company culture" });
  }

});

// GET company culture attributes (tags)
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
  

export default router;
