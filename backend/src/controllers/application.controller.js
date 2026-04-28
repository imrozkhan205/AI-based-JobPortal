// backend/src/controllers/application.controller.js
import pool from "../database/db.js";
import { v2 as cloudinary } from 'cloudinary';
import path from "path";
import axios from "axios";

// Apply for a job
export const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clerkId = req.user?.sub;
        
        // Debug logging
        console.log("📥 Apply for job request:", {
            jobId,
            clerkId,
            hasBody: !!req.body,
            bodyType: typeof req.body,
            contentType: req.headers['content-type'],
            bodyKeys: req.body ? Object.keys(req.body) : 'N/A'
        });
        
        // Safety check for req.body
        if (!req.body) {
            console.error("❌ req.body is undefined. Headers:", req.headers);
            return res.status(400).json({ 
                message: "Request body is missing or invalid" 
            });
        }
        
        const { coverLetter, resumeUrl } = req.body || {};

        // Get user's database ID
        const [userRows] = await pool.query(
            "SELECT id, role FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = userRows[0].id;
        const userRole = userRows[0].role;

        // Check if user is a jobseeker
        if (userRole !== 'jobseeker') {
            return res.status(403).json({ 
                message: "Only jobseekers can apply for jobs" 
            });
        }

        // Check if job exists
        const [jobRows] = await pool.query(
            "SELECT id, posted_by FROM jobs WHERE id = ?",
            [jobId]
        );

        if (jobRows.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Prevent applying to own job
        if (jobRows[0].posted_by === userId) {
            return res.status(400).json({ 
                message: "You cannot apply to your own job posting" 
            });
        }

        // Check if already applied
        const [existingApplication] = await pool.query(
            "SELECT id FROM applications WHERE job_id = ? AND user_id = ?",
            [jobId, userId]
        );

        if (existingApplication.length > 0) {
            return res.status(400).json({ 
                message: "You have already applied for this job" 
            });
        }

        // Create application
        const [result] = await pool.query(
            `INSERT INTO applications (job_id, user_id, cover_letter, resume_url, status) 
             VALUES (?, ?, ?, ?, 'pending')`,
            [jobId, userId, coverLetter || null, resumeUrl || null]
        );

        console.log("✅ Application submitted successfully:", result.insertId);

        res.status(201).json({
            message: "Application submitted successfully",
            applicationId: result.insertId,
            application: {
                id: result.insertId,
                job_id: jobId,
                user_id: userId,
                cover_letter: coverLetter || null,
                resume_url: resumeUrl || null,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error("❌ Error applying for job:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Get user's applications (for jobseekers)
export const getMyApplications = async (req, res) => {
    try {
        const clerkId = req.user.sub;
        const { page = 1, limit = 10, status } = req.query;

        // Get user's database ID
        const [userRows] = await pool.query(
            "SELECT id FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = userRows[0].id;
        const offset = (page - 1) * limit;

        // Build query with optional status filter
        let query = `
            SELECT 
                a.*,
                j.title as job_title,
                j.company,
                j.location,
                j.job_type,
                j.salary_range,
                j.currency,
                DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
        `;
        
        const queryParams = [userId];

        if (status) {
            query += ` AND a.status = ?`;
            queryParams.push(status);
        }

        query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [applications] = await pool.query(query, queryParams);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM applications 
            WHERE user_id = ?
        `;
        const countParams = [userId];

        if (status) {
            countQuery += ` AND status = ?`;
            countParams.push(status);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalApplications: total,
                hasNextPage: offset + applications.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error("❌ Error fetching applications:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Get applications for a specific job (for employers)
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clerkId = req.user.sub;
        const { page = 1, limit = 10, status } = req.query;

        // Get user's database ID
        const [userRows] = await pool.query(
            "SELECT id FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = userRows[0].id;

        // Check if job exists and user owns it
        const [jobRows] = await pool.query(
            "SELECT id FROM jobs WHERE id = ? AND posted_by = ?",
            [jobId, userId]
        );

        if (jobRows.length === 0) {
            return res.status(404).json({ 
                message: "Job not found or you don't have permission to view applications" 
            });
        }

        const offset = (page - 1) * limit;

        // Build query with optional status filter
        let query = `
            SELECT 
                a.*,
                u.email as applicant_email,
                DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
            FROM applications a
            JOIN users u ON a.user_id = u.id
            WHERE a.job_id = ?
        `;
        
        const queryParams = [jobId];

        if (status) {
            query += ` AND a.status = ?`;
            queryParams.push(status);
        }

        query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [applications] = await pool.query(query, queryParams);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM applications 
            WHERE job_id = ?
        `;
        const countParams = [jobId];

        if (status) {
            countQuery += ` AND status = ?`;
            countParams.push(status);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalApplications: total,
                hasNextPage: offset + applications.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error("❌ Error fetching job applications:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Update application status (for employers)
export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const clerkId = req.user.sub;

        console.log("🔄 UPDATE STATUS REQUEST:", { applicationId, status, clerkId });

        // Validate status
        const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            console.log("❌ Invalid status:", status);
            return res.status(400).json({ 
                message: "Invalid status. Must be one of: pending, reviewed, accepted, rejected" 
            });
        }

        // Get user's database ID
        const [userRows] = await pool.query(
            "SELECT id, role FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            console.log("❌ User not found:", clerkId);
            return res.status(404).json({ message: "User not found" });
        }

        const userId = userRows[0].id;
        const userRole = userRows[0].role;

        console.log("👤 User info:", { userId, userRole });

        // Check if user is an employer
        if (userRole !== 'employer') {
            console.log("❌ Not an employer:", userRole);
            return res.status(403).json({ 
                message: "Only employers can update application status" 
            });
        }

        // Check if application exists and user owns the job
        const [applicationRows] = await pool.query(
            `SELECT a.id, a.status as current_status, j.title, j.posted_by 
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = ? AND j.posted_by = ?`,
            [applicationId, userId]
        );

        console.log("📋 Application check:", applicationRows);

        if (applicationRows.length === 0) {
            console.log("❌ Application not found or no permission");
            return res.status(404).json({ 
                message: "Application not found or you don't have permission to update it" 
            });
        }

        console.log("✅ Found application:", applicationRows[0]);

        // Update application status
        const [result] = await pool.query(
            `UPDATE applications 
             SET status = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [status, applicationId]
        );

        console.log("📝 Update result:", result);

        if (result.affectedRows === 0) {
            console.log("❌ No rows affected");
            return res.status(404).json({ message: "Failed to update application" });
        }

        console.log("✅ Application status updated successfully");

        res.json({ 
            message: "Application status updated successfully",
            status,
            applicationId: parseInt(applicationId)
        });
    } catch (error) {
        console.error("❌ Error updating application status:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Check if user has applied for a job
export const checkApplicationStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const clerkId = req.user.sub;

        // Get user's database ID
        const [userRows] = await pool.query(
            "SELECT id FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = userRows[0].id;

        // Check if application exists
        const [applications] = await pool.query(
            `SELECT id, status, created_at 
             FROM applications 
             WHERE job_id = ? AND user_id = ?`,
            [jobId, userId]
        );

        if (applications.length === 0) {
            return res.json({ 
                hasApplied: false 
            });
        }

        res.json({
            hasApplied: true,
            application: applications[0]
        });
    } catch (error) {
        console.error("❌ Error checking application status:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Configure Cloudinary (will be initialized when first used)
let cloudinaryConfigured = false;

const configureCloudinary = () => {
    if (!cloudinaryConfigured) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error('Cloudinary credentials are missing. Please check your .env file.');
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });
        cloudinaryConfigured = true;
        console.log("✅ Cloudinary configured successfully for:", cloudName);
    }
};

// Upload resume file for application to Cloudinary
export const uploadResume = async (req, res) => {
    try {
        // Debug logging
        console.log("📤 Upload resume request:", {
            hasFile: !!req.file,
            fileField: req.file ? req.file.fieldname : 'N/A',
            bodyKeys: Object.keys(req.body || {}),
            contentType: req.headers['content-type']
        });

        // Configure Cloudinary if not already configured
        try {
            configureCloudinary();
        } catch (configError) {
            console.error("❌ Cloudinary configuration error:", configError);
            return res.status(500).json({
                success: false,
                message: "Cloudinary configuration error. Please check your environment variables.",
                error: configError.message
            });
        }

        if (!req.file) {
            console.error("❌ No file in request:", {
                files: req.files,
                body: req.body,
                headers: req.headers
            });
            return res.status(400).json({
                success: false,
                message: 'No resume file uploaded. Please ensure the file field is named "resume" and the file is valid.'
            });
        }

        console.log("📤 Uploading resume to Cloudinary:", {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        const ext = path.extname(req.file.originalname || "").toLowerCase();
        const format = ext.startsWith(".") ? ext.slice(1) : "";
        const allowedFormats = new Set(["pdf", "doc", "docx"]);
        const uploadFormat = allowedFormats.has(format) ? format : undefined;

        // Cloudinary previews PDFs best when uploaded as resource_type "image"
        // (doc/docx should remain "raw")
        const resourceType =
            uploadFormat === "pdf" || req.file.mimetype === "application/pdf"
                ? "image"
                : "raw";

        // Generate unique public_id (without folder, as folder option handles it)
        const publicId = `application-resume-${Date.now()}-${Math.round(Math.random() * 1E9)}`;

        // Upload to Cloudinary using upload_stream for better handling of raw files
        // PDFs stored as 'raw' can be viewed directly in the browser via secure_url
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder: 'resumes', // Organize files in a folder
                    public_id: publicId,
                    use_filename: false,
                    overwrite: false
                    ,
                    // Ensure the delivered URL includes a useful extension (helps browser preview/opening)
                    ...(uploadFormat ? { format: uploadFormat } : {}),
                    // Hint the correct content-type when serving the file
                    ...(req.file.mimetype ? { content_type: req.file.mimetype } : {})
                },
                (error, result) => {
                    if (error) {
                        console.error("❌ Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            // Handle stream errors
            uploadStream.on('error', (error) => {
                console.error("❌ Stream error:", error);
                reject(error);
            });

            // Write buffer to stream
            if (req.file.buffer) {
                uploadStream.write(req.file.buffer);
                uploadStream.end();
            } else {
                reject(new Error('File buffer is empty'));
            }
        });

        console.log("✅ Resume uploaded to Cloudinary successfully:", result.public_id);
        
        res.status(200).json({
            success: true,
            message: "Resume uploaded successfully",
            resumeUrl: result.secure_url, // Cloudinary secure URL
            publicId: result.public_id,
            filename: req.file.originalname,
            format: uploadFormat || null,
            cloudinary: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim() || null,
                public_id: result.public_id,
                asset_id: result.asset_id,
                resource_type: result.resource_type,
                bytes: result.bytes,
                format: result.format,
                original_filename: result.original_filename,
                folder: result.folder
            }
        });

    } catch (error) {
        console.error("❌ Error uploading resume to Cloudinary:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            message: "Failed to upload resume to cloud storage",
            error: error.message || "Unknown error occurred"
        });
    }
};

function guessResumeExtension(url, contentType) {
    const u = String(url || "");
    if (u.toLowerCase().includes(".pdf")) return ".pdf";
    if (u.toLowerCase().includes(".docx")) return ".docx";
    if (u.toLowerCase().includes(".doc")) return ".doc";

    const ct = String(contentType || "").toLowerCase();
    if (ct.includes("pdf")) return ".pdf";
    if (ct.includes("wordprocessingml.document")) return ".docx";
    if (ct.includes("msword")) return ".doc";
    return "";
}

// Stream the application's resume inline (prevents "forced download" behavior in some browsers/CDNs)
export const viewApplicationResume = async (req, res) => {
    try {
        const applicationId = Number(req.params.applicationId);
        if (!Number.isFinite(applicationId)) {
            return res.status(400).json({ message: "Invalid applicationId" });
        }

        const clerkId = req.user?.sub;
        const [userRows] = await pool.query("SELECT id FROM users WHERE clerk_id = ?", [clerkId]);
        if (userRows.length === 0) return res.status(404).json({ message: "User not found" });
        const requesterUserId = userRows[0].id;

        const [rows] = await pool.query(
            `SELECT a.resume_url, a.user_id AS applicant_user_id, j.posted_by AS employer_user_id
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             WHERE a.id = ?`,
            [applicationId]
        );

        if (rows.length === 0) return res.status(404).json({ message: "Application not found" });

        const { resume_url: resumeUrl, applicant_user_id: applicantUserId, employer_user_id: employerUserId } = rows[0];
        if (!resumeUrl) return res.status(404).json({ message: "No resume attached" });

        // Only the applicant or the employer who posted the job can view the resume
        if (requesterUserId !== applicantUserId && requesterUserId !== employerUserId) {
            return res.status(403).json({ message: "You cannot access this resume" });
        }

        const upstream = await axios.get(resumeUrl, {
            responseType: "stream",
            timeout: 30000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: (s) => s >= 200 && s < 400,
        });

        const contentType = upstream.headers?.["content-type"] || "application/octet-stream";
        const ext = guessResumeExtension(resumeUrl, contentType);

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="resume${ext}"`);
        res.setHeader("Cache-Control", "no-store");

        upstream.data.on("error", (err) => {
            console.error("❌ Resume upstream stream error:", err);
            res.destroy(err);
        });

        upstream.data.pipe(res);
    } catch (error) {
        console.error("❌ Error streaming resume:", error?.message || error);
        res.status(500).json({ message: "Failed to load resume" });
    }
};
