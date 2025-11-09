// backend/src/routes/email.routes.ts
import { Router } from 'express';
import emailController from '../controllers/email.controller';
import { checkJwt, extractUser } from '../middleware/auth.middleware';

const router = Router();

// PROTECTED route - Requires authentication
router.post('/generate', 
  checkJwt,           // Validate JWT token
  extractUser,        // Extract user info
  (req, res) => emailController.generateEmail(req, res)
);

// Public routes (these don't need auth)
router.get('/tones', (req, res) => emailController.getTones(req, res));
router.get('/audiences', (req, res) => emailController.getAudiences(req, res));
router.get('/templates', (req, res) => emailController.getTemplates(req, res));

export default router;