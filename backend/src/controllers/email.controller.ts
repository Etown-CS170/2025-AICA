// backend/src/controllers/email.controller.ts
import { Request, Response } from 'express';
import emailService, { EmailGenerationRequest } from '../services/email.service';

class EmailController {
  /**
   * Generate email based on user input
   * POST /api/email/generate
   * PROTECTED - Requires authentication
   */
  async generateEmail(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, tone, audience }: EmailGenerationRequest = req.body;

      const userId = (req as any).auth?.payload?.sub;
      const userEmail = (req as any).auth?.payload?.email;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized request'
        });
        return;
      }

      // console.log(`📨 User ${userId} (${userEmail}) generating email`);

      if (!prompt || !tone || !audience) {
        res.status(400).json({
          success: false,
          error: 'Invalid request'
        });
        return;
      }

      if (typeof prompt !== 'string' || typeof tone !== 'string' || typeof audience !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid request'
        });
        return;
      }

      const cleanedPrompt = prompt.trim();
      const cleanedTone = tone.trim();
      const cleanedAudience = audience.trim();

      if (!cleanedPrompt || !cleanedTone || !cleanedAudience) {
        res.status(400).json({
          success: false,
          error: 'Invalid request'
        });
        return;
      }

      // console.log(`📨 Request received - Prompt: "${cleanedPrompt.substring(0, 50)}...", Tone: ${cleanedTone}, Audience: ${cleanedAudience}`);

      const result = await emailService.generateEmail({ 
        prompt: cleanedPrompt, 
        tone: cleanedTone, 
        audience: cleanedAudience 
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        // console.error('❌ Email generation failed');
        res.status(500).json({
          success: false,
          error: 'An error occurred while generating the email'
        });
      }

    } catch (error: any) {
      // console.error('❌ ERROR IN CONTROLLER');
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get available tones
   * GET /api/email/tones
   * PUBLIC - No authentication required
   */
  async getTones(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      tones: [
        { id: 'professional', label: 'Professional', description: 'Clear, direct, business-appropriate' },
        { id: 'friendly', label: 'Friendly', description: 'Warm, approachable, conversational' },
        { id: 'formal', label: 'Formal', description: 'Respectful, structured, traditional' },
        { id: 'persuasive', label: 'Persuasive', description: 'Compelling, action-oriented' }
      ]
    });
  }

  /**
   * Get available audience types
   * GET /api/email/audiences
   * PUBLIC - No authentication required
   */
  async getAudiences(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      audiences: [
        { id: 'professor', label: 'Professor', description: 'Academic and respectful tone' },
        { id: 'student', label: 'Student', description: 'Casual but professional' },
        { id: 'coach', label: 'Coach/Trainer', description: 'Respectful and direct' },
        { id: 'professional', label: 'Professional', description: 'Business-appropriate' }
      ]
    });
  }

  /**
   * Get email templates
   * GET /api/email/templates
   * PUBLIC - No authentication required
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      templates: [
        { id: 'thank-you', name: 'Thank You Email', prompt: 'Write a thank you email' },
        { id: 'meeting-request', name: 'Meeting Request', prompt: 'Request a meeting to discuss' },
        { id: 'follow-up', name: 'Follow Up', prompt: 'Write a follow-up email' },
        { id: 'introduction', name: 'Introduction', prompt: 'Write an introduction email' },
        { id: 'apology', name: 'Apology', prompt: 'Write an apology email for' },
        { id: 'feedback-request', name: 'Feedback Request', prompt: 'Request feedback on' }
      ]
    });
  }
}

export default new EmailController();
