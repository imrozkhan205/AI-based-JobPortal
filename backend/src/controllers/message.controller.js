// backend/src/controllers/message.controller.js
import pool from "../database/db.js";

// Helper: verify user can access this application's conversation (employer or applicant)
async function canAccessConversation(applicationId, userId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.user_id as applicant_id, j.posted_by as employer_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.id = ?`,
    [applicationId]
  );
  if (rows.length === 0) return false;
  const { applicant_id, employer_id } = rows[0];
  return userId === applicant_id || userId === employer_id;
}

// GET /api/messages/conversations - List conversations for current user
export const getConversations = async (req, res) => {
  try {
    const clerkId = req.user.sub;

    const [userRows] = await pool.query(
      "SELECT id, role FROM users WHERE clerk_id = ?",
      [clerkId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userRows[0].id;
    const userRole = userRows[0].role;

    let query;
    if (userRole === "jobseeker") {
      // Jobseeker: conversations = applications I made; other party = employer
      query = `
        SELECT 
          a.id as application_id,
          a.job_id,
          j.title as job_title,
          j.company,
          u.email as other_party_email,
          u.id as other_party_id,
          (SELECT content FROM messages WHERE application_id = a.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE application_id = a.id ORDER BY created_at DESC LIMIT 1) as last_message_at
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON j.posted_by = u.id
        WHERE a.user_id = ?
        ORDER BY COALESCE((SELECT created_at FROM messages WHERE application_id = a.id ORDER BY created_at DESC LIMIT 1), a.created_at) DESC
      `;
    } else {
      // Employer: conversations = applications to my jobs; other party = applicant
      query = `
        SELECT 
          a.id as application_id,
          a.job_id,
          j.title as job_title,
          j.company,
          u.email as other_party_email,
          u.id as other_party_id,
          (SELECT content FROM messages WHERE application_id = a.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE application_id = a.id ORDER BY created_at DESC LIMIT 1) as last_message_at
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.user_id = u.id
        WHERE j.posted_by = ?
        ORDER BY COALESCE((SELECT created_at FROM messages WHERE application_id = a.id ORDER BY created_at DESC LIMIT 1), a.created_at) DESC
      `;
    }

    const [conversations] = await pool.query(query, [userId]);

    res.json({
      conversations: conversations.map((c) => ({
        applicationId: c.application_id,
        jobId: c.job_id,
        jobTitle: c.job_title,
        company: c.company,
        otherPartyEmail: c.other_party_email,
        otherPartyId: c.other_party_id,
        lastMessage: c.last_message,
        lastMessageAt: c.last_message_at,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/messages/:applicationId - Get messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const clerkId = req.user.sub;

    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE clerk_id = ?",
      [clerkId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userRows[0].id;

    const canAccess = await canAccessConversation(applicationId, userId);
    if (!canAccess) {
      return res.status(403).json({ message: "You cannot access this conversation" });
    }

    const [messages] = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.created_at
       FROM messages m
       WHERE m.application_id = ?
       ORDER BY m.created_at ASC`,
      [applicationId]
    );

    const messagesWithOwn = messages.map((m) => ({
      ...m,
      isOwn: m.sender_id === userId,
    }));

    res.json({ messages: messagesWithOwn });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/messages/:applicationId - Send a message
export const sendMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { content } = req.body;
    const clerkId = req.user.sub;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ message: "Message content is required" });
    }
    if (content.length > 5000) {
      return res.status(400).json({ message: "Message too long" });
    }

    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE clerk_id = ?",
      [clerkId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userRows[0].id;

    const canAccess = await canAccessConversation(applicationId, userId);
    if (!canAccess) {
      return res.status(403).json({ message: "You cannot send messages in this conversation" });
    }

    const [result] = await pool.query(
      "INSERT INTO messages (application_id, sender_id, content) VALUES (?, ?, ?)",
      [applicationId, userId, content.trim()]
    );

    const [rows] = await pool.query(
      "SELECT id, sender_id, content, created_at FROM messages WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({ message: rows[0] });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
