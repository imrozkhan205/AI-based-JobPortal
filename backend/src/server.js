import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobRoutes from './routes/job.route.js'
import userRoutes from './routes/user.route.js'
import authRoutes from './routes/auth.route.js'
import resumeRoutes from './routes/resume.route.js'
import applicationRoutes from './routes/application.route.js'
import messageRoutes from './routes/message.route.js'
import { clerkAuthMiddleware } from './middleware/authMiddleware.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT;


app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

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
app.use('/api/messages', messageRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});