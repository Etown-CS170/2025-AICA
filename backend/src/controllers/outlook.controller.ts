import { Request, Response } from 'express';
import outlookService from '../services/outlook.service';
import { OutlookTokens } from '../models/outlook-tokens.model';

class OutlookController {
  /**
   * Exchange authorization code for tokens
   * POST /api/outlook/auth/callback
   */
  async handleAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const userId = (req as any).auth?.payload?.sub;

      // console.log('🔍 [AUTH CALLBACK] Starting callback handler');
      // console.log('🔍 [AUTH CALLBACK] User ID:', userId);
      // console.log('🔍 [AUTH CALLBACK] Code received:', code ? 'Yes' : 'No');
      // console.log('🔍 [AUTH CALLBACK] Full auth object:', JSON.stringify((req as any).auth, null, 2));

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

      // console.log('📞 [AUTH CALLBACK] Exchanging code for tokens...');
      const tokens = await outlookService.getAccessToken(code);
      // console.log('✅ [AUTH CALLBACK] Tokens received from Microsoft');

      // Store tokens in database
      // console.log('💾 [AUTH CALLBACK] Saving tokens to database...');
      // console.log('💾 [AUTH CALLBACK] userId:', userId);
      // console.log('💾 [AUTH CALLBACK] Token expiry:', new Date(Date.now() + tokens.expires_in * 1000));

      const savedTokens = await OutlookTokens.findOneAndUpdate(
        { userId },
        {
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
        },
        { upsert: true, new: true }
      );

      // console.log('✅ [AUTH CALLBACK] Tokens saved successfully');
      // console.log('✅ [AUTH CALLBACK] Saved document ID:', savedTokens._id);
      // console.log('✅ [AUTH CALLBACK] Saved for userId:', savedTokens.userId);

      // Immediately verify the save
      const verifyTokens = await OutlookTokens.findOne({ userId });
      // console.log('🔍 [AUTH CALLBACK] Verification check - tokens found:', verifyTokens ? 'Yes' : 'No');
      // if (verifyTokens) {
      //   console.log('🔍 [AUTH CALLBACK] Verification - document ID:', verifyTokens._id);
      // }

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
      const userId = (req as any).auth?.payload?.sub;

      // console.log('🔍 [STATUS] Starting status check');
      // console.log('🔍 [STATUS] User ID:', userId);
      // console.log('🔍 [STATUS] Full auth object:', JSON.stringify((req as any).auth, null, 2));

      if (!userId) {
        console.error('❌ [STATUS] No user ID found in token');
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // console.log('🔍 [STATUS] Searching for tokens in database...');
      const tokenDoc = await OutlookTokens.findOne({ userId });
      // console.log('🔍 [STATUS] Token document found:', tokenDoc ? 'Yes' : 'No');

      if (!tokenDoc) {
        // Let's also check if ANY tokens exist
        const allTokens = await OutlookTokens.find({});
        // console.log('🔍 [STATUS] Total tokens in database:', allTokens.length);
        // if (allTokens.length > 0) {
        //   console.log('🔍 [STATUS] Available userIds in database:', allTokens.map(t => t.userId));
        // }

        // console.log('❌ [STATUS] No tokens found for this user');
        res.status(200).json({
          success: true,
          connected: false
        });
        return;
      }

      // console.log('✅ [STATUS] Token document found');
      // console.log('🔍 [STATUS] Token expires at:', tokenDoc.expiresAt);
      // console.log('🔍 [STATUS] Token expired:', new Date() >= tokenDoc.expiresAt);

      // Try to get user profile to verify token is valid
      try {
        let accessToken = tokenDoc.accessToken;
        if (new Date() >= tokenDoc.expiresAt) {
          // console.log('🔄 [STATUS] Token expired, refreshing...');
          const newTokens = await outlookService.refreshAccessToken(tokenDoc.refreshToken);
          accessToken = newTokens.access_token;

          await OutlookTokens.findOneAndUpdate(
            { userId },
            {
              accessToken: newTokens.access_token,
              refreshToken: newTokens.refresh_token || tokenDoc.refreshToken,
              expiresAt: new Date(Date.now() + newTokens.expires_in * 1000)
            }
          );
          // console.log('✅ [STATUS] Token refreshed successfully');
        }

        // console.log('📞 [STATUS] Fetching user profile from Microsoft...');
        const profile = await outlookService.getUserProfile(accessToken);
        // console.log('✅ [STATUS] Profile retrieved:', profile.mail || profile.userPrincipalName);

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
        // console.log('🗑️ [STATUS] Invalid token deleted');
        
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
      const userId = (req as any).auth?.payload?.sub;

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

      // Get tokens from database
      const tokenDoc = await OutlookTokens.findOne({ userId });

      if (!tokenDoc) {
        res.status(404).json({
          success: false,
          error: 'Outlook not connected. Please authenticate first.'
        });
        return;
      }

      // Check if token is expired
      let accessToken = tokenDoc.accessToken;
      if (new Date() >= tokenDoc.expiresAt) {
        // Refresh token
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
      const userId = (req as any).auth?.payload?.sub;
      const top = parseInt(req.query.top as string) || 10;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Get tokens from database
      const tokenDoc = await OutlookTokens.findOne({ userId });

      if (!tokenDoc) {
        res.status(404).json({
          success: false,
          error: 'Outlook not connected'
        });
        return;
      }

      // Check if token is expired
      let accessToken = tokenDoc.accessToken;
      if (new Date() >= tokenDoc.expiresAt) {
        const newTokens = await outlookService.refreshAccessToken(tokenDoc.refreshToken);
        accessToken = newTokens.access_token;

        await OutlookTokens.findOneAndUpdate(
          { userId },
          {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token || tokenDoc.refreshToken,
            expiresAt: new Date(Date.now() + newTokens.expires_in * 1000)
          }
        );
      }

      const messages = await outlookService.getInboxMessages(accessToken, top);

      res.status(200).json({
        success: true,
        messages
      });
    } catch (error: any) {
      console.error('Get inbox error:', error);
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
      const userId = (req as any).auth?.payload?.sub;

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

      const tokenDoc = await OutlookTokens.findOne({ userId });

      if (!tokenDoc) {
        res.status(404).json({
          success: false,
          error: 'Outlook not connected'
        });
        return;
      }

      let accessToken = tokenDoc.accessToken;
      if (new Date() >= tokenDoc.expiresAt) {
        const newTokens = await outlookService.refreshAccessToken(tokenDoc.refreshToken);
        accessToken = newTokens.access_token;

        await OutlookTokens.findOneAndUpdate(
          { userId },
          {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token || tokenDoc.refreshToken,
            expiresAt: new Date(Date.now() + newTokens.expires_in * 1000)
          }
        );
      }

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
      const userId = (req as any).auth?.payload?.sub;

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