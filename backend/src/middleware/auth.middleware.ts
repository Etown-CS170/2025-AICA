// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

// Auth0 JWT validation middleware
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});

// Custom middleware to extract user info
export const extractUser = (req: Request, res: Response, next: NextFunction) => {
  console.log('Authorization header:', req.headers.authorization);
  if (req.auth) {
    console.log('✅ Authenticated user:', req.auth.payload.sub);
    console.log('✅ User email:', req.auth.payload.email);
  }
  next();
};


// Optional: Middleware to make auth optional
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if Authorization header exists
  if (req.headers.authorization) {
    return checkJwt(req, res, next);
  }
  next();
};