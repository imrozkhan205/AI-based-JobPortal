// backend/src/routes/job.route.js
import express from "express";
import { createJob, getJobs, getJobById, updateJob, deleteJob, getJobsByEmployer } from "../controllers/job.controller.js";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";

const router = express.Router();

// POST /api/jobs - Create a new job
router.post("/", clerkAuthMiddleware, ensureUserInDB, createJob);

// GET /api/jobs - Get all jobs (with optional filtering)
router.get("/", getJobs);

// GET /api/jobs/employer/my-jobs - Get jobs posted by the authenticated employer
router.get("/employer/my-jobs", clerkAuthMiddleware, ensureUserInDB, getJobsByEmployer);

// GET /api/jobs/:id - Get a specific job by ID
router.get("/:id", getJobById);

// PUT /api/jobs/:id - Update a job (only by creator)
router.put("/:id", clerkAuthMiddleware, ensureUserInDB, updateJob);

// DELETE /api/jobs/:id - Delete a job (only by creator)
router.delete("/:id", clerkAuthMiddleware, ensureUserInDB, deleteJob);

export default router;