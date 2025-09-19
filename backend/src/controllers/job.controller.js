// backend/src/controllers/job.controller.js
import pool from "../database/db.js";

export const createJob = async (req, res) => {
    try {
        console.log("🔍 DEBUG createJob - req.user:", req.user);
        console.log("🔍 DEBUG createJob - req.body:", req.body);
        
        const clerkId = req.user.sub; // Get from your custom middleware
        const { title, description, company, location, salary_range, job_type, requirements, benefits } = req.body;

        // Validate required fields
        if (!title || !description || !company || !location || !job_type) {
            return res.status(400).json({
                message: "Title, description, company, location, and job_type are required fields."
            });
        }

        // Get user's database ID from clerk_id
        const [userRows] = await pool.query(
            "SELECT id FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const posted_by = userRows[0].id;

        // Insert job into database
        const [result] = await pool.query(
            `INSERT INTO jobs (title, description, company, location, salary_range, job_type, requirements, benefits, posted_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, company, location, salary_range || null, job_type, requirements || null, benefits || null, posted_by]
        );

        console.log("✅ Job created successfully:", result.insertId);

        res.status(201).json({
            message: "Job listing created successfully",
            jobId: result.insertId,
            job: {
                id: result.insertId,
                title,
                description,
                company,
                location,
                salary_range,
                job_type,
                requirements,
                benefits,
                posted_by
            }
        });
    } catch (error) {
        console.error("❌ Error creating job:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getJobs = async (req, res) => {
    try {
        const { 
            title, 
            location, 
            job_type, 
            company, 
            page = 1, 
            limit = 10,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        let query = `
            SELECT 
                j.*,
                u.email as posted_by_email,
                DATE_FORMAT(j.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
            FROM jobs j
            LEFT JOIN users u ON j.posted_by = u.id
            WHERE 1=1
        `;
        
        const queryParams = [];

        // Add filters
        if (title) {
            query += ` AND j.title LIKE ?`;
            queryParams.push(`%${title}%`);
        }

        if (location) {
            query += ` AND j.location LIKE ?`;
            queryParams.push(`%${location}%`);
        }

        if (job_type) {
            query += ` AND j.job_type = ?`;
            queryParams.push(job_type);
        }

        if (company) {
            query += ` AND j.company LIKE ?`;
            queryParams.push(`%${company}%`);
        }

        // Add sorting
        const validSortColumns = ['created_at', 'title', 'company', 'job_type'];
        const validSortOrders = ['ASC', 'DESC'];
        
        if (validSortColumns.includes(sort_by) && validSortOrders.includes(sort_order.toUpperCase())) {
            query += ` ORDER BY j.${sort_by} ${sort_order.toUpperCase()}`;
        } else {
            query += ` ORDER BY j.created_at DESC`;
        }

        // Add pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        console.log("🔍 DEBUG getJobs query:", query);
        console.log("🔍 DEBUG getJobs params:", queryParams);

        const [jobs] = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM jobs j
            WHERE 1=1
        `;
        
        const countParams = [];
        if (title) {
            countQuery += ` AND j.title LIKE ?`;
            countParams.push(`%${title}%`);
        }
        if (location) {
            countQuery += ` AND j.location LIKE ?`;
            countParams.push(`%${location}%`);
        }
        if (job_type) {
            countQuery += ` AND j.job_type = ?`;
            countParams.push(job_type);
        }
        if (company) {
            countQuery += ` AND j.company LIKE ?`;
            countParams.push(`%${company}%`);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalJobs: total,
                hasNextPage: offset + jobs.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error("❌ Error fetching jobs:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const [jobs] = await pool.query(
            `SELECT 
                j.*,
                u.email as posted_by_email,
                DATE_FORMAT(j.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
            FROM jobs j
            LEFT JOIN users u ON j.posted_by = u.id
            WHERE j.id = ?`,
            [id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.json(jobs[0]);
    } catch (error) {
        console.error("❌ Error fetching job:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const clerkId = req.user.sub;
        const { title, description, company, location, salary_range, job_type, requirements, benefits } = req.body;

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
            "SELECT * FROM jobs WHERE id = ? AND posted_by = ?",
            [id, userId]
        );

        if (jobRows.length === 0) {
            return res.status(404).json({ message: "Job not found or you don't have permission to edit it" });
        }

        // Update job
        const [result] = await pool.query(
            `UPDATE jobs SET 
                title = ?, 
                description = ?, 
                company = ?, 
                location = ?, 
                salary_range = ?, 
                job_type = ?,
                requirements = ?,
                benefits = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND posted_by = ?`,
            [title, description, company, location, salary_range || null, job_type, requirements || null, benefits || null, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job not found or no changes made" });
        }

        res.json({ message: "Job updated successfully" });
    } catch (error) {
        console.error("❌ Error updating job:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
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

        // Delete job (only if user owns it)
        const [result] = await pool.query(
            "DELETE FROM jobs WHERE id = ? AND posted_by = ?",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job not found or you don't have permission to delete it" });
        }

        res.json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting job:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getJobsByEmployer = async (req, res) => {
    try {
        const clerkId = req.user.sub;
        const { page = 1, limit = 10 } = req.query;

        // Get user's database ID
        const [userRows] = await pool.query(
            "SELECT id FROM users WHERE clerk_id = ?", 
            [clerkId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = userRows[0].id;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Get jobs posted by this employer
        const [jobs] = await pool.query(
            `SELECT 
                j.*,
                DATE_FORMAT(j.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
                DATE_FORMAT(j.updated_at, '%Y-%m-%d %H:%i:%s') as formatted_updated_date
            FROM jobs j
            WHERE j.posted_by = ?
            ORDER BY j.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        // Get total count for pagination
        const [countResult] = await pool.query(
            "SELECT COUNT(*) as total FROM jobs WHERE posted_by = ?",
            [userId]
        );

        const totalJobs = countResult[0].total;
        const totalPages = Math.ceil(totalJobs / limit);

        res.json({
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalJobs,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error("❌ Error getting employer jobs:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};