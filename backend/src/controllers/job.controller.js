import pool from "../database/db.js";

export const createJob = async(req, res) => {
    try {
        // const userId = req.auth.userId;
        const {title, description, company, location, salary_range, job_type, posted_by} = req.body;

        if(!title || !description || !company || !location || !job_type || !posted_by) {
            return res.status(400).json({message: "All required fields must be filled."});
        }
        const [result] = await pool.query(
            `INSERT INTO jobs (title, description, company, location, salary_range, job_type, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, company, location, salary_range || null, job_type, posted_by]
        );
        res.status(201).json({
            message: "Job listing created successfully",
            jobId: result.insertId
        });
    } catch (error) {
        console.error("Error creating job", error);
        res.status(500).json({message: "Server error"});
    }
}