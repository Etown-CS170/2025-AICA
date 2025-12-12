import axios from 'axios';

interface OutlookTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface SendEmailRequest {
  subject: string;
  body: string;
  toRecipients: string[];
  ccRecipients?: string[];
  bccRecipients?: string[];
}

interface EmailMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
}

class OutlookService {
  private readonly GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0';
  
  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<OutlookTokens> {
    try {
      const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
      
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        code: code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:4200/outlook/callback',
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access'  // Added User.Read
      });

      const response = await axios.post(tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OutlookTokens> {
    try {
      const tokenEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
      
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access'  // Added User.Read
      });

      const response = await axios.post(tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Send email via Microsoft Graph API
   */
  async sendEmail(accessToken: string, emailData: SendEmailRequest): Promise<boolean> {
    try {
      const message = {
        message: {
          subject: emailData.subject,
          body: {
            contentType: 'HTML',
            content: emailData.body.replace(/\n/g, '<br>')
          },
          toRecipients: emailData.toRecipients.map(email => ({
            emailAddress: {
              address: email
            }
          })),
          ...(emailData.ccRecipients && emailData.ccRecipients.length > 0 && {
            ccRecipients: emailData.ccRecipients.map(email => ({
              emailAddress: {
                address: email
              }
            }))
          }),
          ...(emailData.bccRecipients && emailData.bccRecipients.length > 0 && {
            bccRecipients: emailData.bccRecipients.map(email => ({
              emailAddress: {
                address: email
              }
            }))
          })
        },
        saveToSentItems: true
      };

      await axios.post(
        `${this.GRAPH_API_ENDPOINT}/me/sendMail`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error sending email:', error.response?.data || error.message);
      throw new Error('Failed to send email via Outlook');
    }
  }

  /**
   * Get user's inbox messages
   */
  async getInboxMessages(accessToken: string, top: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await axios.get(
        `${this.GRAPH_API_ENDPOINT}/me/mailfolders/inbox/messages?$top=${top}&$select=id,subject,bodyPreview,from,receivedDateTime,isRead,hasAttachments&$orderby=receivedDateTime DESC`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.value;
    } catch (error: any) {
      console.error('Error getting inbox messages:', error.response?.data || error.message);
      throw new Error('Failed to get inbox messages');
    }
  }

  /**
   * Get specific email message by ID
   */
  async getMessage(accessToken: string, messageId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.GRAPH_API_ENDPOINT}/me/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error getting message:', error.response?.data || error.message);
      throw new Error('Failed to get message');
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(accessToken: string, messageId: string): Promise<boolean> {
    try {
      await axios.patch(
        `${this.GRAPH_API_ENDPOINT}/me/messages/${messageId}`,
        { isRead: true },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error marking message as read:', error.response?.data || error.message);
      throw new Error('Failed to mark message as read');
    }
  }

  /**
   * Create draft email
   */
  async createDraft(accessToken: string, emailData: SendEmailRequest): Promise<string> {
    try {
      const message = {
        subject: emailData.subject,
        body: {
          contentType: 'HTML',
          content: emailData.body.replace(/\n/g, '<br>')
        },
        toRecipients: emailData.toRecipients.map(email => ({
          emailAddress: {
            address: email
          }
        })),
        ...(emailData.ccRecipients && emailData.ccRecipients.length > 0 && {
          ccRecipients: emailData.ccRecipients.map(email => ({
            emailAddress: {
              address: email
            }
          }))
        })
      };

      const response = await axios.post(
        `${this.GRAPH_API_ENDPOINT}/me/messages`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.id;
    } catch (error: any) {
      console.error('Error creating draft:', error.response?.data || error.message);
      throw new Error('Failed to create draft email');
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.GRAPH_API_ENDPOINT}/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      throw new Error('Failed to get user profile');
    }
  }
}

export default new OutlookService();