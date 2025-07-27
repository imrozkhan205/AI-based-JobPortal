import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import { requireAuth } from '@clerk/clerk-sdk-node';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(express.json());

// Public route
app.get('/api/public', (req, res) => {
  res.json({ message: "This is a public API route" });
});

// Protected route
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: "You are authenticated!", userId: req.auth.userId });
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
