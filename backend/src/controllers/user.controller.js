// backend/src/controllers/user.controller.js
import pool from "../database/db.js";

// Get current user info
export const getMe = async (req, res) => {
  try {
    console.log("🔍 DEBUG getMe - req.user:", req.user);
    
    const userId = req.user.sub; // Use req.user.sub from your custom middleware
    const [rows] = await pool.query("SELECT id, email, role FROM users WHERE clerk_id = ?", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ getMe error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user role
export const updateRole = async (req, res) => {
  try {
    console.log("🔍 DEBUG updateRole - req.user:", req.user);
    console.log("🔍 DEBUG updateRole - req.body:", req.body);
    
    const clerkId = req.user.sub; // Use req.user.sub from your custom middleware
    const { role } = req.body;

    console.log("🔍 DEBUG - Updating role for user:", clerkId, "to role:", role);

    if (!["jobseeker", "employer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const [result] = await pool.query(
      "UPDATE users SET role = ? WHERE clerk_id = ?",
      [role, clerkId]
    );

    console.log("🔍 DEBUG - SQL update result:", result);

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found in database" });
    }

    console.log("✅ Role updated successfully");
    res.json({ message: "Role updated successfully", role });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};