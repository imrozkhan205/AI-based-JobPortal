// routes/auth.routes.js
import pool from "../database/db.js";

// Called after Clerk signup
export const clerkSignup =  async (req, res) => {
  try {
    const { clerkId, email } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert only if user doesn't exist
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE clerk_id = ?",
      [clerkId]
    );

    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO users (clerk_id, email) VALUES (?, ?)",
        [clerkId, email]
      );
    }

    res.json({ message: "User synced successfully" });
  } catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: "Server error" });
  }
}

