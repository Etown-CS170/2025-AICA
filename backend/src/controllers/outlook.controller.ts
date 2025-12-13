import { Request, Response } from 'express';
import outlookService from '../services/outlook.service';
import { OutlookTokens } from '../models/outlook-tokens.model';

class OutlookController {
  /**
   * Extract userId from authenticated request
   */
  private getUserId(req: Request): string | null {
    const auth = (req as any).auth;
    return auth?.payload?.sub || null;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate array of email addresses
   */
  private validateEmailArray(emails: string[]): { valid: boolean; invalidEmails: string[] } {
    const invalidEmails = emails.filter(email => !this.isValidEmail(email));
    return {
      valid: invalidEmails.length === 0,
      invalidEmails
    };
  }

  /**
   * Get valid access token for user, refreshing if necessary
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    const tokenDoc = await OutlookTokens.findOne({ userId });

    if (!tokenDoc) {
      throw new Error('Outlook not connected');
    }

    let accessToken = tokenDoc.accessToken;
    
    // Check if token is expired and refresh if needed
    if (new Date() >= tokenDoc.expiresAt) {
      const newTokens = await outlookService.refreshAccessToken(tokenDoc.refreshToken);
      accessToken = newTokens.access_token;

      // Update stored tokens
      await OutlookTokens.findOneAndUpdate(
        { userId },
        {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokenDoc.refreshToken,
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000)
        }
      );
    }

    return accessToken;
  }

  /**
   * Exchange authorization code for tokens
   * POST /api/outlook/auth/callback
   */
  async handleAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const userId = this.getUserId(req);

      if (!userId) {
        console.error('❌ [AUTH CALLBACK] No user ID found in token');
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!code) {
        console.error('❌ [AUTH CALLBACK] No authorization code provided');
        res.status(400).json({
          success: false,
          error: 'Authorization code is required'
        });
        return;
      }

      const tokens = await outlookService.getAccessToken(code);

      // Store tokens in database
      await OutlookTokens.findOneAndUpdate(
        { userId },
        {
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Successfully connected to Outlook'
      });
    } catch (error: any) {
      console.error('❌ [AUTH CALLBACK] Error:', error);
      console.error('❌ [AUTH CALLBACK] Stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to authenticate with Outlook'
      });
    }
  }

  /**
   * Check Outlook connection status
   * GET /api/outlook/status
   * PROTECTED - Requires authentication
   */
  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);

      if (!userId) {
        console.error('❌ [STATUS] No user ID found in token');
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const tokenDoc = await OutlookTokens.findOne({ userId });

      if (!tokenDoc) {
        res.status(200).json({
          success: true,
          connected: false
        });
        return;
      }

      // Try to get user profile to verify token is valid
      try {
        const accessToken = await this.getValidAccessToken(userId);
        const profile = await outlookService.getUserProfile(accessToken);

        res.status(200).json({
          success: true,
          connected: true,
          email: profile.mail || profile.userPrincipalName,
          displayName: profile.displayName
        });
      } catch (error) {
        console.error('❌ [STATUS] Error validating token:', error);
        // Token is invalid, delete it
        await OutlookTokens.findOneAndDelete({ userId });
        
        res.status(200).json({
          success: true,
          connected: false
        });
      }
    } catch (error: any) {
      console.error('❌ [STATUS] Unexpected error:', error);
      console.error('❌ [STATUS] Stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to check connection status'
      });
    }
  }

  /**
   * Send email via Outlook
   * POST /api/outlook/send
   * PROTECTED - Requires authentication
   */
  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { subject, body, toRecipients, ccRecipients, bccRecipients } = req.body;
      const userId = this.getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!subject || !body || !toRecipients || !Array.isArray(toRecipients) || toRecipients.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Subject, body, and at least one recipient are required'
        });
        return;
      }

      // Validate email addresses
      const toValidation = this.validateEmailArray(toRecipients);
      if (!toValidation.valid) {
        res.status(400).json({
          success: false,
          error: `Invalid email address(es) in 'to' field: ${toValidation.invalidEmails.join(', ')}`
        });
        return;
      }

      // Validate CC recipients if provided
      if (ccRecipients && Array.isArray(ccRecipients) && ccRecipients.length > 0) {
        const ccValidation = this.validateEmailArray(ccRecipients);
        if (!ccValidation.valid) {
          res.status(400).json({
            success: false,
            error: `Invalid email address(es) in 'cc' field: ${ccValidation.invalidEmails.join(', ')}`
          });
          return;
        }
      }

      // Validate BCC recipients if provided
      if (bccRecipients && Array.isArray(bccRecipients) && bccRecipients.length > 0) {
        const bccValidation = this.validateEmailArray(bccRecipients);
        if (!bccValidation.valid) {
          res.status(400).json({
            success: false,
            error: `Invalid email address(es) in 'bcc' field: ${bccValidation.invalidEmails.join(', ')}`
          });
          return;
        }
      }

      // Get valid access token (will refresh if needed)
      const accessToken = await this.getValidAccessToken(userId);

      // Send email
      await outlookService.sendEmail(accessToken, {
        subject,
        body,
        toRecipients,
        ccRecipients,
        bccRecipients
      });

      res.status(200).json({
        success: true,
        message: 'Email sent successfully'
      });
    } catch (error: any) {
      console.error('Send email error:', error);
      
      if (error.message === 'Outlook not connected') {
        res.status(404).json({
          success: false,
          error: 'Outlook not connected. Please authenticate first.'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to send email'
      });
    }
  }

  /**
   * Get inbox messages
   * GET /api/outlook/inbox
   * PROTECTED - Requires authentication
   */
  async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const top = parseInt(req.query.top as string) || 10;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Get valid access token (will refresh if needed)
      const accessToken = await this.getValidAccessToken(userId);
      const messages = await outlookService.getInboxMessages(accessToken, top);

      res.status(200).json({
        success: true,
        messages
      });
    } catch (error: any) {
      console.error('Get inbox error:', error);

      if (error.message === 'Outlook not connected') {
        res.status(404).json({
          success: false,
          error: 'Outlook not connected. Please authenticate first.'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get inbox messages'
      });
    }
  }

  /**
   * Create draft email
   * POST /api/outlook/draft
   * PROTECTED - Requires authentication
   */
  async createDraft(req: Request, res: Response): Promise<void> {
    try {
      const { subject, body, toRecipients, ccRecipients } = req.body;
      const userId = this.getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!subject || !body || !toRecipients) {
        res.status(400).json({
          success: false,
          error: 'Subject, body, and recipients are required'
        });
        return;
      }

      // Validate email addresses
      if (Array.isArray(toRecipients) && toRecipients.length > 0) {
        const toValidation = this.validateEmailArray(toRecipients);
        if (!toValidation.valid) {
          res.status(400).json({
            success: false,
            error: `Invalid email address(es) in 'to' field: ${toValidation.invalidEmails.join(', ')}`
          });
          return;
        }
      }

      // Validate CC recipients if provided
      if (ccRecipients && Array.isArray(ccRecipients) && ccRecipients.length > 0) {
        const ccValidation = this.validateEmailArray(ccRecipients);
        if (!ccValidation.valid) {
          res.status(400).json({
            success: false,
            error: `Invalid email address(es) in 'cc' field: ${ccValidation.invalidEmails.join(', ')}`
          });
          return;
        }
      }

      // Get valid access token (will refresh if needed)
      const accessToken = await this.getValidAccessToken(userId);

      const draftId = await outlookService.createDraft(accessToken, {
        subject,
        body,
        toRecipients,
        ccRecipients
      });

      res.status(200).json({
        success: true,
        draftId,
        message: 'Draft created successfully'
      });
    } catch (error: any) {
      console.error('Create draft error:', error);

      if (error.message === 'Outlook not connected') {
        res.status(404).json({
          success: false,
          error: 'Outlook not connected. Please authenticate first.'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create draft'
      });
    }
  }

  /**
   * Disconnect Outlook
   * DELETE /api/outlook/disconnect
   * PROTECTED - Requires authentication
   */
  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      await OutlookTokens.findOneAndDelete({ userId });

      res.status(200).json({
        success: true,
        message: 'Outlook disconnected successfully'
      });
    } catch (error: any) {
      console.error('Disconnect error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect Outlook'
      });
    }
  }
}

export default new OutlookController();