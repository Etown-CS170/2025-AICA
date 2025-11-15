import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import emailRoutes from './routes/email.routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (optional — comment out for production)
app.use((req: Request, res: Response, next: NextFunction) => {
  // console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/email', emailRoutes);

// Health check (public)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Not found'
  });
});

// Custom Express error type
interface ExpressError extends Error {
  status?: number;
}

// Global error handler
app.use((err: ExpressError, req: Request, res: Response, next: NextFunction) => {
  // console.error('❌ An unexpected error occurred', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid or missing'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  // console.log(`🚀 AICA Backend Server running on port ${PORT}`);
  // console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
