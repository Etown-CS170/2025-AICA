import { Request, Response } from 'express';
import userPreferencesService from '../services/user-preferences.service';

class PreferencesController {
  /**
   * Get all user preferences
   * GET /api/preferences
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const preferences = await userPreferencesService.getUserPreferences(userId);
      res.status(200).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
    }
  }

  /**
   * Update tones
   * PUT /api/preferences/tones
   */
  async updateTones(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { tones } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!Array.isArray(tones) || tones.length > 5) {
        res.status(400).json({ success: false, error: 'Invalid tones data' });
        return;
      }

      const updated = await userPreferencesService.updateTones(userId, tones);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Add a tone
   * POST /api/preferences/tones
   */
  async addTone(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const tone = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.addTone(userId, tone);
      res.status(201).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete a tone
   * DELETE /api/preferences/tones/:id
   */
  async deleteTone(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.deleteTone(userId, id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Update audiences
   * PUT /api/preferences/audiences
   */
  async updateAudiences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { audiences } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!Array.isArray(audiences) || audiences.length > 4) {
        res.status(400).json({ success: false, error: 'Invalid audiences data' });
        return;
      }

      const updated = await userPreferencesService.updateAudiences(userId, audiences);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Add an audience
   * POST /api/preferences/audiences
   */
  async addAudience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const audience = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.addAudience(userId, audience);
      res.status(201).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete an audience
   * DELETE /api/preferences/audiences/:id
   */
  async deleteAudience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.deleteAudience(userId, id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Update templates
   * PUT /api/preferences/templates
   */
  async updateTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { templates } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!Array.isArray(templates) || templates.length > 6) {
        res.status(400).json({ success: false, error: 'Invalid templates data' });
        return;
      }

      const updated = await userPreferencesService.updateTemplates(userId, templates);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Add a template
   * POST /api/preferences/templates
   */
  async addTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const template = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.addTemplate(userId, template);
      res.status(201).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete a template
   * DELETE /api/preferences/templates/:id
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.deleteTemplate(userId, id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Save an email
   * POST /api/preferences/emails
   */
  async saveEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const email = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.saveEmail(userId, email);
      res.status(201).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Update an email
   * PUT /api/preferences/emails/:id
   */
  async updateEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { id } = req.params;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.updateEmail(userId, id, updates);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete an email
   * DELETE /api/preferences/emails/:id
   */
  async deleteEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.deleteEmail(userId, id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Toggle email favorite
   * PATCH /api/preferences/emails/:id/favorite
   */
  async toggleEmailFavorite(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.toggleEmailFavorite(userId, id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Reset to defaults
   * POST /api/preferences/reset
   */
  async resetToDefaults(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).auth?.payload?.sub;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await userPreferencesService.resetToDefaults(userId);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new PreferencesController();