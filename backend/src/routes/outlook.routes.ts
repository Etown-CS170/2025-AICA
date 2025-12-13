import { Router } from 'express';
import outlookController from '../controllers/outlook.controller';
import { checkJwt, extractUser } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(checkJwt);
router.use(extractUser);

// Auth callback - exchange code for tokens
router.post('/auth/callback', (req, res) => outlookController.handleAuthCallback(req, res));

// Send email
router.post('/send', (req, res) => outlookController.sendEmail(req, res));

// Get inbox messages
router.get('/inbox', (req, res) => outlookController.getInbox(req, res));

// Create draft
router.post('/draft', (req, res) => outlookController.createDraft(req, res));

// Check connection status
router.get('/status', (req, res) => outlookController.getConnectionStatus(req, res));

// Disconnect
router.delete('/disconnect', (req, res) => outlookController.disconnect(req, res));

export default router;