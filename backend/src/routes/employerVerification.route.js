import express from "express";
import {
  createEmployerVerificationRequest,
  getMyEmployerVerification,
  listEmployerVerificationRequests,
  reviewEmployerVerificationRequest,
} from "../controllers/employerVerification.controller.js";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";
import { requireTeamMember } from "../middleware/requireTeamMember.js";
import { sendMail } from "../services/email.service.js";

const router = express.Router();

// Jobseeker view + submit
router.get("/me", clerkAuthMiddleware, ensureUserInDB, getMyEmployerVerification);
router.post(
  "/request",
  clerkAuthMiddleware,
  ensureUserInDB,
  createEmployerVerificationRequest
);

// Team (admin) review endpoints
router.get(
  "/requests",
  clerkAuthMiddleware,
  ensureUserInDB,
  requireTeamMember,
  listEmployerVerificationRequests
);
router.patch(
  "/requests/:id",
  clerkAuthMiddleware,
  ensureUserInDB,
  requireTeamMember,
  reviewEmployerVerificationRequest
);

// Team utility: send a quick test email to validate SMTP/Gmail config
router.post(
  "/test-email",
  clerkAuthMiddleware,
  ensureUserInDB,
  requireTeamMember,
  async (req, res) => {
    try {
      const to = String(req.body?.to || req.teamEmail || "").trim();
      const result = await sendMail({
        to,
        subject: "JobSpace email test",
        text: "If you received this, email notifications are configured correctly.",
      });
      res.json({ message: "Test email processed", to, result });
    } catch (error) {
      res.status(500).json({
        message: "Test email failed",
        error: error?.message || String(error),
      });
    }
  }
);

export default router;
