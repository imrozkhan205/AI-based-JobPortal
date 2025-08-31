import express from 'express';
import { clerkSignup } from '../controllers/auth.controller.js';

const router = express.Router()
router.post("/sync-user", clerkSignup)

export default router;