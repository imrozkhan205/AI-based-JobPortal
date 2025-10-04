import axios from 'axios';
import FormData from 'form-data';
import pool from '../database/db.js'; // Import your MySQL connection pool

// Python BERT service URL
const BERT_SERVICE_URL = process.env.BERT_SERVICE_URL || 'http://localhost:5001';

/**
 * Controller for POST /api/resume/analyze
 * Upload resume and get matched jobs using BERT AI
 */
export const analyzeResume = async (req, res) => {
    let connection;
    try {
        // Check if file exists (handled by multer, but good for safety)
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No resume file uploaded'
            });
        }

        console.log('📄 Analyzing resume:', req.file.originalname);
        console.log('👤 User:', req.user.sub); // Clerk user ID

        // Step 1: Extract text from resume using Python BERT service
        const formData = new FormData();
        formData.append('resume', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        let resumeText;
        try {
            console.log('🔄 Sending resume to BERT service for extraction...');

            const extractResponse = await axios.post(
                `${BERT_SERVICE_URL}/extract-resume`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 30000, // 30 second timeout
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );

            if (!extractResponse.data.success) {
                throw new Error('Failed to extract resume text');
            }

            resumeText = extractResponse.data.resumeText;
            console.log(`✅ Extracted ${resumeText.length} characters from resume`);

        } catch (error) {
            console.error('❌ Error extracting resume:', error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    message: 'BERT service is not available. Please try again later.',
                    error: 'Service unavailable'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to extract text from resume',
                error: error.response?.data?.error || error.message
            });
        }

        // Step 2: Fetch all active jobs from database (MySQL)
        let jobs = [];
        try {
            console.log('🔄 Fetching jobs from database...');

            const query = ` SELECT  id, title, company, description, requirements, location, salary_range, job_type, benefits, created_at, posted_by FROM jobs`;
// title, description, company, location, salary_range, job_type, requirements, benefits
            // Use the pool to execute the query
            const [rows] = await pool.query(query);
            jobs = rows;

            if (!jobs || jobs.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No active jobs available at the moment',
                    resumeText: resumeText.substring(0, 500),
                    matchedJobs: [],
                    totalJobs: 0,
                    analyzedAt: new Date().toISOString()
                });
            }

            console.log(`✅ Found ${jobs.length} active jobs`);

        } catch (error) {
            console.error('❌ Error fetching jobs from MySQL:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch jobs from database',
                error: error.message
            });
        }

        // Step 3: Use BERT to match resume with jobs
        try {
            console.log('🤖 Sending to BERT for job matching...');

            const matchResponse = await axios.post(
                `${BERT_SERVICE_URL}/match-jobs`,
                {
                    resumeText: resumeText,
                    // Map MySQL column names to BERT service expected fields (id is essential)
                    jobs: jobs.map(job => ({
                        id: job.id.toString(), // MySQL 'id' column
                        title: job.title,
                        company: job.company,
                        description: job.description,
                        requirements: job.requirements || '',
                        location: job.location,
                        salary_range: job.salary_range,
                        job_type: job.job_type,
                        benefits: job.benefits,
                        created_at: job.created_at,
                        posted_by: job.posted_by
                    }))
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000, // 60 second timeout for matching
                }
            );

            if (!matchResponse.data.success) {
                throw new Error('Failed to match jobs with resume');
            }

            const matchedJobs = matchResponse.data.matchedJobs;
            console.log(`✅ Successfully matched ${matchedJobs.length} jobs`);

            // Step 4: Return results to frontend
            return res.status(200).json({
                success: true,
                resumeText: resumeText.substring(0, 500), // First 500 chars for preview
                matchedJobs: matchedJobs,
                totalJobs: jobs.length,
                analyzedAt: new Date().toISOString(),
                userId: req.user.sub
            });

        } catch (error) {
            console.error('❌ Error matching jobs:', error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    message: 'BERT service is not available. Please try again later.',
                    error: 'Service unavailable'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to match jobs with resume',
                error: error.response?.data?.error || error.message
            });
        }

    } catch (error) {
        console.error('❌ Error in analyze endpoint:', error);

        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Controller for GET /api/resume/health
 * Check if BERT service is online and responding
 */
export const checkBertServiceHealth = async (req, res) => {
    try {
        const response = await axios.get(`${BERT_SERVICE_URL}/health`, {
            timeout: 5000
        });

        return res.status(200).json({
            success: true,
            bertService: 'online',
            model: response.data.model,
            status: response.data.status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ BERT service health check failed:', error.message);
        return res.status(503).json({
            success: false,
            bertService: 'offline',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Controller for POST /api/resume/extract-text
 * Extract text from resume without matching (for testing)
 */
export const extractResumeText = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No resume file uploaded'
            });
        }

        const formData = new FormData();
        formData.append('resume', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const extractResponse = await axios.post(
            `${BERT_SERVICE_URL}/extract-resume`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 30000,
            }
        );

        if (!extractResponse.data.success) {
            throw new Error('Failed to extract resume text');
        }

        return res.status(200).json({
            success: true,
            resumeText: extractResponse.data.resumeText,
            length: extractResponse.data.length,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('❌ Error extracting text:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to extract text from resume',
            error: error.message
        });
    }
};