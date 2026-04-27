import pool from "../database/db.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

export async function requireTeamMember(req, res, next) {
  try {
    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
      return res.status(500).json({
        message:
          "Server not configured: set ADMIN_EMAILS in backend/.env (comma-separated).",
      });
    }

    const clerkId = req.user?.sub;
    if (!clerkId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const [rows] = await pool.query("SELECT email FROM users WHERE clerk_id = ?", [
      clerkId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const email = normalizeEmail(rows[0].email);
    if (!adminEmails.includes(email)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.teamEmail = email;
    next();
  } catch (error) {
    console.error("❌ requireTeamMember error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

