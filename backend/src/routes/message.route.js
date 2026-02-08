// backend/src/routes/message.route.js
import express from "express";
import multer from "multer";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  getAttachment,
} from "../controllers/message.controller.js";

const router = express.Router();

// Optional file upload for chat (doc, pdf, word) - max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF and Word (doc/docx) are allowed."));
  },
});

router.get("/conversations", clerkAuthMiddleware, ensureUserInDB, getConversations);
router.get("/:applicationId/attachment/:messageId", clerkAuthMiddleware, ensureUserInDB, getAttachment);
router.get("/:applicationId", clerkAuthMiddleware, ensureUserInDB, getMessages);
router.post(
  "/:applicationId",
  clerkAuthMiddleware,
  ensureUserInDB,
  (req, res, next) => {
    upload.single("attachment")(req, res, (err) => {
      if (err) {
        if (err.message && err.message.includes("Invalid file type")) {
          return res.status(400).json({ message: err.message });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File too large. Max 10MB." });
        }
        return res.status(400).json({ message: err.message || "File upload failed" });
      }
      next();
    });
  },
  sendMessage
);

export default router;
