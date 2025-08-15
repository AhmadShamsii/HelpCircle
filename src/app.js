import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/user.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // 🔑 ensure Authorization is allowed
}));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// basic health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;