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
  if (req.auth) {
    // User info is available in req.auth
    // You can access: req.auth.payload.sub (user ID)
    console.log('Authenticated user:', req.auth.payload.sub);
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