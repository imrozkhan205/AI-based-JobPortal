// backend/src/routes/user.route.js
import express from "express";
import { getMe, updateRole } from "../controllers/user.controller.js";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js"; // Use your custom middleware
import { ensureUserInDB } from "../middleware/ensureUser.js";

const router = express.Router();

// GET /api/users/me - Use your custom auth middleware
router.get("/me", clerkAuthMiddleware, ensureUserInDB, getMe);

// PUT /api/users/role - Use your custom auth middleware
router.put("/role", clerkAuthMiddleware, ensureUserInDB, updateRole);

export default router;