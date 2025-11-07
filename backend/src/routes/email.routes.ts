import { Router } from 'express';
import emailController from '../controllers/email.controller';
import { checkJwt, extractUser, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Protected route - requires authentication
router.post('/generate', checkJwt, extractUser, (req, res) => 
  emailController.generateEmail(req, res)
);

// Public routes (or use optionalAuth if you want to support both)
router.get('/tones', (req, res) => emailController.getTones(req, res));
router.get('/audiences', (req, res) => emailController.getAudiences(req, res));
router.get('/templates', (req, res) => emailController.getTemplates(req, res));

export default router;