import { Router } from 'express';
import preferencesController from '../controllers/preferences.controller';
import { checkJwt, extractUser } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(checkJwt);
router.use(extractUser);

// Get all preferences
router.get('/', (req, res) => preferencesController.getPreferences(req, res));

// Tones
router.put('/tones', (req, res) => preferencesController.updateTones(req, res));
router.post('/tones', (req, res) => preferencesController.addTone(req, res));
router.delete('/tones/:id', (req, res) => preferencesController.deleteTone(req, res));

// Audiences
router.put('/audiences', (req, res) => preferencesController.updateAudiences(req, res));
router.post('/audiences', (req, res) => preferencesController.addAudience(req, res));
router.delete('/audiences/:id', (req, res) => preferencesController.deleteAudience(req, res));

// Templates
router.put('/templates', (req, res) => preferencesController.updateTemplates(req, res));
router.post('/templates', (req, res) => preferencesController.addTemplate(req, res));
router.delete('/templates/:id', (req, res) => preferencesController.deleteTemplate(req, res));

// Saved Emails
router.post('/emails', (req, res) => preferencesController.saveEmail(req, res));
router.put('/emails/:id', (req, res) => preferencesController.updateEmail(req, res));
router.delete('/emails/:id', (req, res) => preferencesController.deleteEmail(req, res));
router.patch('/emails/:id/favorite', (req, res) => preferencesController.toggleEmailFavorite(req, res));

// Signatures
router.put('/signatures', (req, res) => preferencesController.updateSignatures(req, res));
router.post('/signatures', (req, res) => preferencesController.addSignature(req, res));
router.delete('/signatures/:id', (req, res) => preferencesController.deleteSignature(req, res));
router.patch('/signatures/:id/default', (req, res) => preferencesController.setDefaultSignature(req, res));

// Reset
router.post('/reset', (req, res) => preferencesController.resetToDefaults(req, res));

export default router;