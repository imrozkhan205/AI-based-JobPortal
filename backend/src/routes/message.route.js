// backend/src/routes/message.route.js
import express from "express";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/conversations", clerkAuthMiddleware, ensureUserInDB, getConversations);
router.get("/:applicationId", clerkAuthMiddleware, ensureUserInDB, getMessages);
router.post("/:applicationId", clerkAuthMiddleware, ensureUserInDB, sendMessage);

export default router;
