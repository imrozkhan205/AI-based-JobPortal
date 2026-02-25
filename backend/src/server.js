import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jobRoutes from './routes/job.route.js'
import userRoutes from './routes/user.route.js'
import authRoutes from './routes/auth.route.js'
import resumeRoutes from './routes/resume.route.js'
import applicationRoutes from './routes/application.route.js'
import messageRoutes from './routes/message.route.js'
import chatbotRoutes from './routes/chatbot.route.js';
import { clerkAuthMiddleware } from './middleware/authMiddleware.js';
import atsCheckerRoutes from './routes/atsChecker.js';
import companyRoutes from './routes/company.route.js';
import reviewRoutes from "./routes/review.routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware - must be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public route
app.get('/api/public', (req, res) => {
  res.json({ message: "This is a public API route" });
});

// Protected route with debugging
app.get('/api/protected', (req, res, next) => {
  console.log('Protected route hit');
  console.log('Headers:', req.headers);
  console.log('Authorization header:', req.headers.authorization);
  next();
}, clerkAuthMiddleware, (req, res) => {
  console.log('Authentication successful');
  res.json({ message: "You are authenticated!" });
});

app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/applications', applicationRoutes);
app.use('/api/ats', atsCheckerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use("/api/reviews", reviewRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
