import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OutlookConnectionStatus {
  connected: boolean;
  email?: string;
  displayName?: string;
}

export interface SendEmailRequest {
  subject: string;
  body: string;
  toRecipients: string[];
  ccRecipients?: string[];
  bccRecipients?: string[];
}

export interface InboxMessage {
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

@Injectable({
  providedIn: 'root'
})
export class OutlookService {
  private apiUrl = environment.apiUrl;
  
  // Observable for connection status
  private connectionStatusSubject = new BehaviorSubject<OutlookConnectionStatus>({ connected: false });
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Initialize OAuth flow - redirect to Microsoft login
   */
  initiateOAuthFlow(): void {
    const authUrl = this.buildAuthUrl();
    console.log('🔗 Authorization URL:', authUrl);
    window.location.href = authUrl;
  }

  /**
   * Build Microsoft OAuth authorization URL
   */
  private buildAuthUrl(): string {
    const clientId = environment.microsoft.clientId;
    const redirectUri = environment.microsoft.redirectUri;
    const scope = 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access';
    const state = this.generateRandomState();
    
    // Store state in sessionStorage for validation
    sessionStorage.setItem('outlook_oauth_state', state);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scope,
      state: state
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Generate random state for OAuth security
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Handle OAuth callback - exchange code for tokens
   */
  async handleOAuthCallback(code: string, state: string, token: string): Promise<boolean> {
    try {
      // Validate state
      const savedState = sessionStorage.getItem('outlook_oauth_state');
      if (state !== savedState) {
        console.error('OAuth state mismatch');
        return false;
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          `${this.apiUrl}/outlook/auth/callback`,
          { code },
          { headers }
        )
      );

      if (response.success) {
        // Clear state
        sessionStorage.removeItem('outlook_oauth_state');
        
        // Refresh connection status
        await this.checkConnectionStatus(token);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }

  /**
   * Check connection status
   */
  async checkConnectionStatus(token: string): Promise<OutlookConnectionStatus> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; connected: boolean; email?: string; displayName?: string }>(
          `${this.apiUrl}/outlook/status`,
          { headers }
        )
      );

      const status: OutlookConnectionStatus = {
        connected: response.connected,
        email: response.email,
        displayName: response.displayName
      };

      this.connectionStatusSubject.next(status);
      return status;
    } catch (error) {
      console.error('Check status error:', error);
      const status: OutlookConnectionStatus = { connected: false };
      this.connectionStatusSubject.next(status);
      return status;
    }
  }

  /**
   * Send email via Outlook
   */
  async sendEmail(emailData: SendEmailRequest, token: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          `${this.apiUrl}/outlook/send`,
          emailData,
          { headers }
        )
      );

      return response.success;
    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }

  /**
   * Create draft email
   */
  async createDraft(emailData: SendEmailRequest, token: string): Promise<string | null> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; draftId: string; message: string }>(
          `${this.apiUrl}/outlook/draft`,
          emailData,
          { headers }
        )
      );

      return response.success ? response.draftId : null;
    } catch (error) {
      console.error('Create draft error:', error);
      return null;
    }
  }

  /**
   * Get inbox messages
   */
  async getInboxMessages(token: string, top: number = 10): Promise<InboxMessage[]> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; messages: InboxMessage[] }>(
          `${this.apiUrl}/outlook/inbox?top=${top}`,
          { headers }
        )
      );

      return response.success ? response.messages : [];
    } catch (error) {
      console.error('Get inbox error:', error);
      return [];
    }
  }

  /**
   * Disconnect Outlook
   */
  async disconnect(token: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message: string }>(
          `${this.apiUrl}/outlook/disconnect`,
          { headers }
        )
      );

      if (response.success) {
        this.connectionStatusSubject.next({ connected: false });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  }

  /**
   * Get current connection status (from BehaviorSubject)
   */
  getCurrentStatus(): OutlookConnectionStatus {
    return this.connectionStatusSubject.value;
  }
}