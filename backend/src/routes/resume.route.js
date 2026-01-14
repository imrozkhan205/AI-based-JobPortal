// backend/src/routes/resume.route.js
import express from 'express';
import multer from 'multer';
import { clerkAuthMiddleware } from '../middleware/authMiddleware.js';
import { ensureUserInDB } from '../middleware/ensureUser.js';
import {
    analyzeResume,
    checkBertServiceHealth,
    extractResumeText,
} from '../controllers/resume.controller.js'; // Import the new controllers

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            // Pass an error to multer to be caught by the route handler's try/catch
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
    }
});

/**
 * POST /api/resume/analyze
 * Upload resume and get matched jobs using BERT AI
 * Requires authentication
 */
router.post(
    '/analyze',
    clerkAuthMiddleware,
    ensureUserInDB,
    upload.single('resume'),
    analyzeResume // Use the imported controller function
);

/**
 * GET /api/resume/health
 * Check if BERT service is online and responding
 * No authentication required
 */
router.get(
    '/health',
    checkBertServiceHealth // Use the imported controller function
);

/**
 * POST /api/resume/extract-text
 * Extract text from resume without matching (for testing)
 * Requires authentication
 */
router.post(
    '/extract-text',
    clerkAuthMiddleware,
    ensureUserInDB,
    upload.single('resume'),
    extractResumeText // Use the imported controller function
);

export default router;