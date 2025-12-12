import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OutlookService } from '../services/outlook.service';
import { AuthService } from '@auth0/auth0-angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-outlook-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div class="text-center max-w-2xl px-4">
        <div *ngIf="isProcessing" class="space-y-4">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-lg text-gray-700 dark:text-gray-300">Connecting to Outlook...</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ debugMessage }}</p>
        </div>
        
        <div *ngIf="error" class="space-y-4">
          <div class="text-red-600 dark:text-red-400">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <p class="text-lg text-gray-700 dark:text-gray-300">{{ error }}</p>
          
          <!-- Debug Information -->
          <div *ngIf="debugInfo" class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <p class="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">Debug Info:</p>
            <pre class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ debugInfo }}</pre>
          </div>
          
          <button 
            (click)="goHome()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Home
          </button>
        </div>

        <div *ngIf="success" class="space-y-4">
          <div class="text-green-600 dark:text-green-400">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p class="text-lg text-gray-700 dark:text-gray-300">Successfully connected to Outlook!</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    </div>
  `
})
// Also ensure your main.ts has skipRedirectCallback properly configured:
// skipRedirectCallback: (window.location.pathname === '/outlook/callback')

export class OutlookCallbackComponent implements OnInit {
  isProcessing: boolean = true;
  error: string = '';
  success: boolean = false;
  debugMessage: string = '';
  debugInfo: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private outlookService: OutlookService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {
      console.log('🔍 Starting Outlook OAuth callback handler');
      this.debugMessage = 'Checking callback parameters...';
      
      // Get code and state from query params
      const code = this.route.snapshot.queryParamMap.get('code');
      const state = this.route.snapshot.queryParamMap.get('state');
      const errorParam = this.route.snapshot.queryParamMap.get('error');
      const errorDescription = this.route.snapshot.queryParamMap.get('error_description');

      console.log('📝 Callback params:', { 
        hasCode: !!code,
        codeLength: code?.length || 0,
        hasState: !!state,
        stateLength: state?.length || 0,
        error: errorParam,
        errorDescription 
      });

      // Store debug info
      this.debugInfo = JSON.stringify({
        hasCode: !!code,
        codeLength: code?.length || 0,
        hasState: !!state,
        stateLength: state?.length || 0,
        error: errorParam,
        errorDescription,
        url: window.location.href
      }, null, 2);

      // Check for OAuth error
      if (errorParam) {
        console.error('❌ OAuth error from Microsoft:', errorParam, errorDescription);
        this.isProcessing = false;
        this.error = errorDescription || 'Authentication failed. Please try again.';
        return;
      }

      if (!code || !state) {
        console.error('❌ Missing code or state parameter');
        this.isProcessing = false;
        this.error = 'Invalid callback parameters. Please try connecting again.';
        return;
      }

      console.log('✅ Code and state received');
      this.debugMessage = 'Checking authentication status...';

      // FIX: Use firstValueFrom with a timeout to prevent infinite waiting
      let isAuthenticated = false;
      try {
        isAuthenticated = await Promise.race([
          firstValueFrom(this.auth.isAuthenticated$),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
        ]);
      } catch (authError) {
        console.warn('⚠️ Auth check timeout, proceeding anyway:', authError);
        isAuthenticated = false;
      }
      
      console.log('🔐 Auth0 authentication status:', isAuthenticated);

      if (!isAuthenticated) {
        console.error('❌ User not authenticated with Auth0');
        this.isProcessing = false;
        this.error = 'Please sign in to AICA first before connecting Outlook.';
        setTimeout(() => this.router.navigate(['/']), 3000);
        return;
      }

      console.log('✅ User is authenticated with Auth0');
      this.debugMessage = 'Getting access token...';

      // FIX: Get Auth0 token with better error handling and timeout
      let token: string | undefined;
      try {
        token = await Promise.race([
          firstValueFrom(this.auth.getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://aica-backend-api'
            },
            cacheMode: 'on'
          })),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Token fetch timeout')), 10000)
          )
        ]);
        
        console.log('✅ Got Auth0 access token:', token ? 'Token received' : 'No token');
      } catch (tokenError: any) {
        console.error('❌ Token error:', tokenError);
        this.debugInfo += '\n\nToken Error: ' + JSON.stringify(tokenError, null, 2);
        
        // FIX: Try to continue anyway if we have a cached token
        try {
          token = await firstValueFrom(this.auth.getAccessTokenSilently({
            authorizationParams: {
              audience: 'https://aica-backend-api'
            },
            cacheMode: 'cache-only'
          }));
          
          if (!token) {
            this.isProcessing = false;
            this.error = 'Session expired. Please sign in again.';
            setTimeout(() => this.router.navigate(['/']), 3000);
            return;
          }
        } catch (cacheError) {
          this.isProcessing = false;
          this.error = 'Authentication required. Please sign in first.';
          setTimeout(() => this.router.navigate(['/']), 3000);
          return;
        }
      }

      if (!token) {
        console.error('❌ No token received from Auth0');
        this.isProcessing = false;
        this.error = 'Authentication required. Please sign in first.';
        setTimeout(() => this.router.navigate(['/']), 3000);
        return;
      }

      console.log('🔄 Exchanging authorization code for tokens...');
      this.debugMessage = 'Exchanging code for tokens...';

      // Exchange code for tokens
      const success = await this.outlookService.handleOAuthCallback(code, state, token);

      console.log('📊 Exchange result:', success ? 'SUCCESS ✅' : 'FAILED ❌');

      this.isProcessing = false;

      if (success) {
        console.log('🎉 Outlook successfully connected!');
        this.success = true;
        this.debugMessage = 'Connection successful!';
        
        // Force a connection status check before redirecting
        console.log('🔄 Checking connection status...');
        await this.outlookService.checkConnectionStatus(token);
        
        // Redirect to home after 2 seconds
        console.log('🏠 Redirecting to home in 2 seconds...');
        setTimeout(() => this.router.navigate(['/']), 2000);
      } else {
        console.error('❌ Failed to connect to Outlook');
        this.error = 'Failed to connect to Outlook. Please try again.';
        this.debugInfo += '\n\nExchange failed - check backend logs for more details';
      }
    } catch (error: any) {
      console.error('❌ Unexpected callback error:', error);
      this.isProcessing = false;
      this.error = 'An unexpected error occurred. Please try again.';
      this.debugInfo += '\n\nUnexpected Error: ' + JSON.stringify({
        message: error?.message,
        stack: error?.stack,
        error: error
      }, null, 2);
    }
  }

  goHome(): void {
    console.log('🏠 Navigating to home');
    this.router.navigate(['/']);
  }
}