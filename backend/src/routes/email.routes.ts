import { Router } from 'express';
import emailController from '../controllers/email.controller';

const router = Router();

// Main email generation endpoint
router.post('/generate', (req, res) => emailController.generateEmail(req, res));

// Get available tones
router.get('/tones', (req, res) => emailController.getTones(req, res));

// Get available audience types
router.get('/audiences', (req, res) => emailController.getAudiences(req, res));

// Get email templates
router.get('/templates', (req, res) => emailController.getTemplates(req, res));

export default router;