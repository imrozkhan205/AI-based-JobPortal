import express from "express";
import db from "../database/db.js";

const router = express.Router();

// POST helpful / not helpful vote
router.post("/:id/helpful", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { is_helpful } = req.body;

    const userId = 5; // TEMP test user (must exist in users table)

    // Insert or update vote
    await db.query(
      `INSERT INTO review_helpfulness (review_id, user_id, is_helpful)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_helpful = VALUES(is_helpful)`,
      [reviewId, userId, is_helpful]
    );

    // Update counts
    await db.query(
      `UPDATE employee_reviews
       SET
         helpful_count = (
           SELECT COUNT(*) FROM review_helpfulness
           WHERE review_id = ? AND is_helpful = true
         ),
         not_helpful_count = (
           SELECT COUNT(*) FROM review_helpfulness
           WHERE review_id = ? AND is_helpful = false
         )
       WHERE id = ?`,
      [reviewId, reviewId, reviewId]
    );

    res.json({ message: "Vote recorded" });

  } catch (error) {
    console.error("Helpfulness error:", error);
    res.status(500).json({ error: "Failed to record vote" });
  }
});

export default router;
