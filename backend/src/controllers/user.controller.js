// backend/src/controllers/user.controller.js
import pool from "../database/db.js";

// Get current user info
export const getMe = async (req, res) => {
  try {
    console.log("🔍 DEBUG getMe - req.user:", req.user);
    
    const userId = req.user.sub; // Use req.user.sub from your custom middleware
    const [rows] = await pool.query(
      "SELECT id, email, role, employer_verified FROM users WHERE clerk_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", rows[0]);
    res.json({
      ...rows[0],
      employer_verified: Boolean(rows[0].employer_verified),
    });
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
    
    if (!req.user || !req.user.sub) {
      console.error("❌ No user found in request");
      return res.status(401).json({ message: "Authentication required" });
    }

    const clerkId = req.user.sub; // Use req.user.sub from your custom middleware
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    console.log("🔍 DEBUG - Updating role for user:", clerkId, "to role:", role);

    if (!["jobseeker", "employer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'jobseeker' or 'employer'" });
    }

    // First check if user exists
    const [userCheck] = await pool.query(
      "SELECT id, role, employer_verified FROM users WHERE clerk_id = ?",
      [clerkId]
    );

    if (userCheck.length === 0) {
      console.error("❌ User not found in database:", clerkId);
      return res.status(404).json({ message: "User not found in database. Please try logging out and back in." });
    }

    console.log("🔍 DEBUG - Current user role:", userCheck[0].role);

    if (role === "employer" && !userCheck[0].employer_verified) {
      return res.status(403).json({
        message:
          "Employer verification required. Submit your employer details and wait for approval before switching.",
        code: "EMPLOYER_NOT_VERIFIED",
      });
    }

    const [result] = await pool.query(
      "UPDATE users SET role = ? WHERE clerk_id = ?",
      [role, clerkId]
    );

    console.log("🔍 DEBUG - SQL update result:", result);

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      console.error("❌ No rows affected by update");
      return res.status(500).json({ message: "Failed to update role. No rows affected." });
    }

    console.log("✅ Role updated successfully from", userCheck[0].role, "to", role);
    res.json({ message: "Role updated successfully", role });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ 
      message: "Server error while updating role", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
