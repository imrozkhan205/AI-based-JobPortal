import express from "express";
import multer from "multer";
import { 
    applyForJob, 
    getMyApplications, 
    getJobApplications, 
    updateApplicationStatus,
    checkApplicationStatus,
    uploadResume,
    viewApplicationResume
} from "../controllers/application.controller.js";
import { clerkAuthMiddleware } from "../middleware/authMiddleware.js";
import { ensureUserInDB } from "../middleware/ensureUser.js";

const router = express.Router();

// Configure multer for resume uploads
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// ⭐ CRITICAL: NON-PARAMETERIZED ROUTES MUST COME FIRST ⭐

// 1. Upload resume - MUST be before /:jobId route
router.post(
    "/upload-resume", 
    clerkAuthMiddleware, 
    ensureUserInDB, 
    (req, res, next) => {
        upload.single('resume')(req, res, (err) => {
            if (err) {
                console.error("❌ Multer error:", err);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error',
                    error: err.message
                });
            }
            next();
        });
    }, 
    uploadResume
);

// 2. Get user's applications - MUST be before parameterized routes
router.get(
    "/my-applications", 
    clerkAuthMiddleware, 
    ensureUserInDB, 
    getMyApplications
);

// ⭐ PARAMETERIZED ROUTES COME AFTER ⭐

// 3. Check application status for a job
router.get(
    "/check/:jobId", 
    clerkAuthMiddleware, 
    ensureUserInDB, 
    checkApplicationStatus
);

// 4. Apply for a job
router.post(
    "/:jobId", 
    clerkAuthMiddleware, 
    ensureUserInDB, 
    applyForJob
);

// 5. Get applications for a specific job (employer)
router.get(
    "/job/:jobId", 
    clerkAuthMiddleware, 
    ensureUserInDB, 
    getJobApplications
);

// 6. Update application status
router.patch(
    "/:applicationId/status", 
    clerkAuthMiddleware, 
    ensureUserInDB, 
    updateApplicationStatus
);

// 7. View/preview application resume inline
router.get(
    "/:applicationId/resume",
    clerkAuthMiddleware,
    ensureUserInDB,
    viewApplicationResume
);

export default router;
