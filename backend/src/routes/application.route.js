// backend/src/routes/application.route.js
import express from "express";
import { 
    applyForJob, 
    getMyApplications, 
    getJobApplications, 
    updateApplicationStatus,
    checkApplicationStatus 
} from "../controllers/application.controller.js";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";

const router = express.Router();

// POST /api/applications/:jobId - Apply for a job
router.post("/:jobId", clerkAuthMiddleware, ensureUserInDB, applyForJob);

// GET /api/applications/my-applications - Get user's applications
router.get("/my-applications", clerkAuthMiddleware, ensureUserInDB, getMyApplications);

// GET /api/applications/job/:jobId - Get applications for a specific job (employer only)
router.get("/job/:jobId", clerkAuthMiddleware, ensureUserInDB, getJobApplications);

// PATCH /api/applications/:applicationId/status - Update application status (employer only)
router.patch("/:applicationId/status", clerkAuthMiddleware, ensureUserInDB, updateApplicationStatus);

// GET /api/applications/check/:jobId - Check if user has applied for a job
router.get("/check/:jobId", clerkAuthMiddleware, ensureUserInDB, checkApplicationStatus);

export default router;