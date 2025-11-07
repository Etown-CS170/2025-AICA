import { Router } from 'express';
import emailController from '../controllers/email.controller';

const router = Router();

// PUBLIC route - NO AUTH for testing
router.post('/generate', (req, res) => 
  emailController.generateEmail(req, res)
);

// Public routes
router.get('/tones', (req, res) => emailController.getTones(req, res));
router.get('/audiences', (req, res) => emailController.getAudiences(req, res));
router.get('/templates', (req, res) => emailController.getTemplates(req, res));

export default router;