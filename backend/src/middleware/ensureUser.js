// middleware/ensureUser.js
import pool from "../database/db.js";

export async function ensureUserInDB(req, res, next) {
  try {
    console.log("🔍 DEBUG ensureUser - req.auth:", req.auth);
    console.log("🔍 DEBUG ensureUser - req.user:", req.user);

    // Try multiple ways to get the clerk ID and email
    const clerkId = req.auth?.userId || req.user?.sub || req.auth?.sub;
    const email = req.auth?.user?.emailAddresses?.[0]?.emailAddress || 
                  req.user?.email_addresses?.[0]?.email_address ||
                  req.user?.email || 
                  req.auth?.user?.email ||
                  null;

    console.log("🔍 DEBUG ensureUser - Extracted clerkId:", clerkId);
    console.log("🔍 DEBUG ensureUser - Extracted email:", email);

    if (!clerkId) {
      console.error("❌ No clerk ID found in ensureUserInDB");
      return res.status(400).json({ message: "User ID not found" });
    }

    // Check if user exists
    const [rows] = await pool.query(
      `SELECT id FROM users WHERE clerk_id = ?`,
      [clerkId]
    );

    console.log("🔍 DEBUG ensureUser - Database query result:", rows);

    if (rows.length === 0) {
      console.log("🔍 DEBUG ensureUser - Creating new user...");
      await pool.query(
        `INSERT INTO users (clerk_id, email, role) VALUES (?, ?, 'jobseeker')`,
        [clerkId, email]
      );
      console.log(`✅ Inserted new user: ${email} with clerk_id: ${clerkId}`);
    } else {
      console.log(`✅ User already exists: ${clerkId}`);
    }

    next();
  } catch (error) {
    console.error("❌ Error in ensureUserInDB:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}