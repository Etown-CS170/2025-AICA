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

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
    message: 'Route not found'
  });
});

// Error handler
// Global Error Handler (update in your app.ts or server.ts)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('=================================');
  console.error('❌ GLOBAL ERROR HANDLER TRIGGERED');
  console.error(`Time: ${new Date().toISOString()}`);
  console.error(`Route: ${req.method} ${req.originalUrl}`);
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('=================================');

  // Auth0 or JWT Unauthorized errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing token',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle validation or operational errors with status code
  const statusCode = err.status || 500;
  const responseMessage = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AICA Backend Server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth0 Domain: ${process.env.AUTH0_DOMAIN}`);
  console.log(`🔐 Auth0 Audience: ${process.env.AUTH0_AUDIENCE}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
});