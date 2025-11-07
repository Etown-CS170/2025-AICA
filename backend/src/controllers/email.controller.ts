import { Request, Response } from 'express';
import emailService, { EmailGenerationRequest } from '../services/email.service';

class EmailController {
  /**
   * Generate email based on user input
   * POST /api/email/generate
   */
  async generateEmail(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, tone, audience }: EmailGenerationRequest = req.body;

      // Access authenticated user (added for Auth0)
      const userId = req.auth?.payload.sub;
      const userEmail = req.auth?.payload.email;
      console.log(`📨 User ${userId} (${userEmail}) generating email`);

      // Validate required fields
      if (!prompt || !tone || !audience) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: prompt, tone, and audience are required'
        });
        return;
      }

      // Validate that fields are strings
      if (typeof prompt !== 'string' || typeof tone !== 'string' || typeof audience !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid field types: prompt, tone, and audience must be strings'
        });
        return;
      }

      // Trim whitespace
      const cleanedPrompt = prompt.trim();
      const cleanedTone = tone.trim();
      const cleanedAudience = audience.trim();

      // Validate non-empty after trimming
      if (!cleanedPrompt || !cleanedTone || !cleanedAudience) {
        res.status(400).json({
          success: false,
          error: 'Fields cannot be empty or contain only whitespace'
        });
        return;
      }

      console.log(`📨 Request received - Prompt: "${cleanedPrompt.substring(0, 50)}...", Tone: ${cleanedTone}, Audience: ${cleanedAudience}`);

      // Generate email (now accepts any string values)
      const result = await emailService.generateEmail({ 
        prompt: cleanedPrompt, 
        tone: cleanedTone, 
        audience: cleanedAudience 
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }

    } catch (error: any) {
      console.error('Error in generateEmail controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get available tones
   * GET /api/email/tones
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