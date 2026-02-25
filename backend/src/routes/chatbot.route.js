import express from "express";
import multer from "multer";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";
import { askChatbot } from "../controllers/chatbot.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(
        new Error(
          "Invalid file type. Only PDF and Word (doc/docx) documents are allowed."
        )
      );
  },
});

router.post(
  "/ask",
  clerkAuthMiddleware,
  ensureUserInDB,
  (req, res, next) => {
    upload.single("document")(req, res, (err) => {
      if (err) {
        if (err.message && err.message.includes("Invalid file type")) {
          return res.status(400).json({ message: err.message });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "File too large. Max 5MB allowed." });
        }
        return res
          .status(400)
          .json({ message: err.message || "File upload failed" });
      }
      next();
    });
  },
  askChatbot
);

export default router;

