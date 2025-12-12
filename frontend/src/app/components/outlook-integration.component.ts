import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OutlookService, SendEmailRequest } from '../services/outlook.service';
import { AuthService } from '@auth0/auth0-angular';
import { LucideAngularModule, Mail, Send, Link, X, Check } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-outlook-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="outlook-integration">
      <!-- Connection Status Card -->
      <div *ngIf="!(outlookService.connectionStatus$ | async)?.connected" 
           class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <lucide-icon [img]="Mail" class="w-6 h-6 text-blue-600 dark:text-blue-400"></lucide-icon>
            <div>
              <p class="font-medium text-blue-900 dark:text-blue-100">Connect Outlook</p>
              <p class="text-sm text-blue-700 dark:text-blue-300">Send emails directly through your Outlook account</p>
            </div>
          </div>
          <button
            (click)="connectOutlook()"
            [disabled]="isCheckingStatus"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <lucide-icon [img]="Link" class="w-4 h-4"></lucide-icon>
            {{ isCheckingStatus ? 'Checking...' : 'Connect' }}
          </button>
        </div>
      </div>

      <!-- Connected Status -->
      <div *ngIf="(outlookService.connectionStatus$ | async)?.connected" 
           class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <lucide-icon [img]="Check" class="w-6 h-6 text-green-600 dark:text-green-400"></lucide-icon>
            <div>
              <p class="font-medium text-green-900 dark:text-green-100">Outlook Connected</p>
              <p class="text-sm text-green-700 dark:text-green-300">
                {{ (outlookService.connectionStatus$ | async)?.email }}
              </p>
            </div>
          </div>
          <button
            (click)="disconnectOutlook()"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            Disconnect
          </button>
        </div>
      </div>

      <!-- Send Email Form (only show when connected) -->
      <div *ngIf="(outlookService.connectionStatus$ | async)?.connected && showSendForm" 
           class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Send via Outlook</h3>
          <button 
            (click)="closeSendForm()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <lucide-icon [img]="X" class="w-5 h-5 text-gray-600 dark:text-gray-400"></lucide-icon>
          </button>
        </div>

        <div class="space-y-4">
          <!-- To Recipients -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To *
            </label>
            <input
              type="text"
              [(ngModel)]="toRecipientsInput"
              placeholder="recipient@example.com (separate multiple with commas)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple recipients with commas
            </p>
          </div>

          <!-- CC Recipients -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CC (optional)
            </label>
            <input
              type="text"
              [(ngModel)]="ccRecipientsInput"
              placeholder="cc@example.com"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <!-- Subject (pre-filled) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              [(ngModel)]="emailSubject"
              placeholder="Email subject"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <!-- Body (pre-filled) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Body *
            </label>
            <textarea
              [(ngModel)]="emailBody"
              rows="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              (click)="sendEmail()"
              [disabled]="!canSend() || isSending"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              <lucide-icon [img]="Send" class="w-5 h-5"></lucide-icon>
              {{ isSending ? 'Sending...' : 'Send Email' }}
            </button>
            <button
              (click)="createDraft()"
              [disabled]="!canSend() || isSending"
              class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div *ngIf="successMessage" 
           class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mt-4">
        {{ successMessage }}
      </div>
      
      <div *ngIf="errorMessage" 
           class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mt-4">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .outlook-integration {
      max-width: 100%;
    }
  `]
})
export class OutlookIntegrationComponent implements OnInit {
  @Input() emailContent: string = '';
  @Input() emailSubject: string = '';
  @Output() onEmailSent = new EventEmitter<boolean>();

  // Lucide icons
  readonly Mail = Mail;
  readonly Send = Send;
  readonly Link = Link;
  readonly X = X;
  readonly Check = Check;

  showSendForm: boolean = false;
  toRecipientsInput: string = '';
  ccRecipientsInput: string = '';
  emailBody: string = '';
  isSending: boolean = false;
  isCheckingStatus: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private accessToken: string | null = null;

  constructor(
    public outlookService: OutlookService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    // Pre-fill email content
    this.emailBody = this.emailContent;

    // Auto-open send form if email content is provided
    if (this.emailContent) {
      this.showSendForm = true;
    }

    // Get Auth0 token and check connection status
    try {
      this.isCheckingStatus = true;
      const token = await firstValueFrom(this.auth.getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://aica-backend-api'
        }
      }));
      
      this.accessToken = token;
      
      // Check connection status immediately on init
      console.log('🔄 Checking Outlook connection status on init...');
      await this.outlookService.checkConnectionStatus(token);
      
      const status = this.outlookService.getCurrentStatus();
      console.log('📊 Current Outlook status:', status);
      
    } catch (err) {
      console.error('❌ Token error:', err);
    } finally {
      this.isCheckingStatus = false;
    }
  }

  connectOutlook(): void {
    this.outlookService.initiateOAuthFlow();
  }

  async disconnectOutlook(): Promise<void> {
    if (!this.accessToken) return;

    if (confirm('Are you sure you want to disconnect Outlook?')) {
      const success = await this.outlookService.disconnect(this.accessToken);
      if (success) {
        this.showMessage('Outlook disconnected successfully', 'success');
      } else {
        this.showMessage('Failed to disconnect Outlook', 'error');
      }
    }
  }

  openSendForm(): void {
    this.showSendForm = true;
    this.emailBody = this.emailContent;
  }

  closeSendForm(): void {
    this.showSendForm = false;
  }

  canSend(): boolean {
    return this.toRecipientsInput.trim().length > 0 &&
           this.emailSubject.trim().length > 0 &&
           this.emailBody.trim().length > 0;
  }

  async sendEmail(): Promise<void> {
    if (!this.accessToken || !this.canSend() || this.isSending) return;

    this.isSending = true;
    this.clearMessages();

    const emailData: SendEmailRequest = {
      subject: this.emailSubject.trim(),
      body: this.emailBody.trim(),
      toRecipients: this.parseRecipients(this.toRecipientsInput),
      ...(this.ccRecipientsInput.trim() && {
        ccRecipients: this.parseRecipients(this.ccRecipientsInput)
      })
    };

    const success = await this.outlookService.sendEmail(emailData, this.accessToken);

    this.isSending = false;

    if (success) {
      this.showMessage('Email sent successfully!', 'success');
      this.onEmailSent.emit(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        this.closeSendForm();
        this.clearForm();
      }, 2000);
    } else {
      this.showMessage('Failed to send email. Please try again.', 'error');
      this.onEmailSent.emit(false);
    }
  }

  async createDraft(): Promise<void> {
    if (!this.accessToken || !this.canSend() || this.isSending) return;

    this.isSending = true;
    this.clearMessages();

    const emailData: SendEmailRequest = {
      subject: this.emailSubject.trim(),
      body: this.emailBody.trim(),
      toRecipients: this.parseRecipients(this.toRecipientsInput),
      ...(this.ccRecipientsInput.trim() && {
        ccRecipients: this.parseRecipients(this.ccRecipientsInput)
      })
    };

    const draftId = await this.outlookService.createDraft(emailData, this.accessToken);

    this.isSending = false;

    if (draftId) {
      this.showMessage('Draft created successfully in Outlook!', 'success');
    } else {
      this.showMessage('Failed to create draft. Please try again.', 'error');
    }
  }

  private parseRecipients(input: string): string[] {
    return input
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = message;
      setTimeout(() => this.successMessage = '', 5000);
    } else {
      this.errorMessage = message;
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private clearForm(): void {
    this.toRecipientsInput = '';
    this.ccRecipientsInput = '';
    this.emailSubject = '';
    this.emailBody = '';
  }
}