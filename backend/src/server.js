import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobRoutes from './routes/job.route.js'
import { clerkAuthMiddleware } from './middleware/authMiddleware.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Your React app's URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});