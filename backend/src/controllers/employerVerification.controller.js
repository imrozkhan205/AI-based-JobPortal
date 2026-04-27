import pool from "../database/db.js";
import { sendMail } from "../services/email.service.js";

function pickString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getDbUserByClerkId(clerkId) {
  const [rows] = await pool.query(
    "SELECT id, email, role, employer_verified FROM users WHERE clerk_id = ?",
    [clerkId]
  );
  return rows[0] || null;
}

async function getLatestRequestByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT
      id,
      employer_name,
      company_name,
      gstin,
      office_address,
      contact_email,
      website,
      status,
      notes,
      reviewed_at,
      reviewed_by,
      created_at,
      updated_at
    FROM employer_verification_requests
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

export const getMyEmployerVerification = async (req, res) => {
  try {
    const clerkId = req.user?.sub;
    if (!clerkId) return res.status(401).json({ message: "Authentication required" });

    const dbUser = await getDbUserByClerkId(clerkId);
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const request = await getLatestRequestByUserId(dbUser.id);

    res.json({
      employerVerified: Boolean(dbUser.employer_verified),
      request,
    });
  } catch (error) {
    console.error("❌ getMyEmployerVerification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createEmployerVerificationRequest = async (req, res) => {
  try {
    const clerkId = req.user?.sub;
    if (!clerkId) return res.status(401).json({ message: "Authentication required" });

    const dbUser = await getDbUserByClerkId(clerkId);
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    if (dbUser.employer_verified) {
      return res
        .status(409)
        .json({ message: "You are already verified as an employer." });
    }

    const employerName = pickString(req.body?.employerName);
    const companyName = pickString(req.body?.companyName);
    const gstin = pickString(req.body?.gstin);
    const officeAddress = pickString(req.body?.officeAddress);
    const contactEmail = pickString(req.body?.email);
    const website = pickString(req.body?.website);

    if (!employerName || !companyName || !gstin || !officeAddress || !contactEmail) {
      return res.status(400).json({
        message:
          "Missing required fields: employerName, companyName, gstin, officeAddress, email",
      });
    }

    if (!isValidEmail(contactEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const latest = await getLatestRequestByUserId(dbUser.id);
    if (latest?.status === "pending") {
      return res.status(200).json({
        message: "Your request is already pending review.",
        request: latest,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO employer_verification_requests
        (user_id, employer_name, company_name, gstin, office_address, contact_email, website, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [dbUser.id, employerName, companyName, gstin, officeAddress, contactEmail, website || null]
    );

    const [rows] = await pool.query(
      `SELECT
        id,
        employer_name,
        company_name,
        gstin,
        office_address,
        contact_email,
        website,
        status,
        notes,
        reviewed_at,
        reviewed_by,
        created_at,
        updated_at
      FROM employer_verification_requests
      WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: "Request submitted", request: rows[0] });
  } catch (error) {
    console.error("❌ createEmployerVerificationRequest error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listEmployerVerificationRequests = async (req, res) => {
  try {
    const status = pickString(req.query?.status);
    const params = [];
    let where = "";
    if (status) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      where = "WHERE evr.status = ?";
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT
        evr.id,
        evr.user_id,
        u.clerk_id,
        u.email AS user_email,
        evr.employer_name,
        evr.company_name,
        evr.gstin,
        evr.office_address,
        evr.contact_email,
        evr.website,
        evr.status,
        evr.notes,
        evr.reviewed_at,
        evr.reviewed_by,
        evr.created_at,
        evr.updated_at
      FROM employer_verification_requests evr
      JOIN users u ON u.id = evr.user_id
      ${where}
      ORDER BY evr.created_at DESC
      LIMIT 500`,
      params
    );

    res.json({ requests: rows });
  } catch (error) {
    console.error("❌ listEmployerVerificationRequests error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reviewEmployerVerificationRequest = async (req, res) => {
  try {
    const clerkId = req.user?.sub;
    if (!clerkId) return res.status(401).json({ message: "Authentication required" });

    const reviewer = await getDbUserByClerkId(clerkId);
    if (!reviewer) return res.status(404).json({ message: "Reviewer not found" });

    const requestId = Number(req.params?.id);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const status = pickString(req.body?.status);
    const notes = pickString(req.body?.notes) || null;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const [existingRows] = await pool.query(
      `SELECT evr.*, u.email AS user_email
       FROM employer_verification_requests evr
       JOIN users u ON u.id = evr.user_id
       WHERE evr.id = ?`,
      [requestId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const existing = existingRows[0];

    await pool.query(
      `UPDATE employer_verification_requests
       SET status = ?, notes = ?, reviewed_at = NOW(), reviewed_by = ?
       WHERE id = ?`,
      [status, notes, reviewer.id, requestId]
    );

    if (status === "approved") {
      await pool.query("UPDATE users SET employer_verified = TRUE WHERE id = ?", [
        existing.user_id,
      ]);
    } else if (status === "rejected") {
      await pool.query("UPDATE users SET employer_verified = FALSE WHERE id = ?", [
        existing.user_id,
      ]);
    }

    let email = { attempted: false, skipped: true };
    const to = pickString(existing.contact_email) || pickString(existing.user_email);
    if (to && isValidEmail(to)) {
      const subject =
        status === "approved"
          ? "JobSpace Employer Verification Approved"
          : "JobSpace Employer Verification Rejected";

      const text =
        status === "approved"
          ? `Hi ${existing.employer_name},\n\nYour employer verification request for "${existing.company_name}" has been APPROVED.\n\nYou can now switch to Employer inside JobSpace.\n\nThanks,\nJobSpace Team`
          : `Hi ${existing.employer_name},\n\nYour employer verification request for "${existing.company_name}" has been REJECTED.\n\nNotes: ${notes || "No notes provided"}\n\nYou can re-apply from Settings.\n\nThanks,\nJobSpace Team`;

      email.attempted = true;
      try {
        const result = await sendMail({ to, subject, text });
        email = { attempted: true, ...result };
      } catch (mailErr) {
        email = {
          attempted: true,
          skipped: false,
          error: mailErr?.message || "Email send failed",
        };
      }
    }

    res.json({ message: "Request reviewed", status, email });
  } catch (error) {
    console.error("❌ reviewEmployerVerificationRequest error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
