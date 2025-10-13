import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { 
  Mail, Send, Copy, RotateCcw, GraduationCap, 
  User, Users, Briefcase, LucideAngularModule, LucideIconData
} from 'lucide-angular';
import { EmailService } from './services/email.service';
import { 
  Message, Tone, Audience, Template, 
  ToneType, AudienceType, EmailRequest 
} from './models/email.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [EmailService]
})
export class AppComponent implements OnInit {
  // Lucide icons
  readonly Mail = Mail;
  readonly Send = Send;
  readonly Copy = Copy;
  readonly RotateCcw = RotateCcw;
  readonly GraduationCap = GraduationCap;
  readonly User = User;
  readonly Users = Users;
  readonly Briefcase = Briefcase;

  // Component state
  messages: Message[] = [];
  inputText: string = '';
  selectedTone: ToneType = 'professional';
  selectedAudience: AudienceType = 'professor';
  isGenerating: boolean = false;
  lastGeneratedEmail: string = '';
  errorMessage: string = '';

  // Data
  tones: Tone[] = [];
  audiences: Audience[] = [];
  templates: Template[] = [];

  constructor(private emailService: EmailService) {}

  ngOnInit(): void {
    this.loadTones();
    this.loadAudiences();
    this.loadTemplates();
    this.checkApiHealth();
  }

  /**
   * Load available tones from API
   */
  loadTones(): void {
    this.emailService.getTones().subscribe({
      next: (tones) => {
        this.tones = tones;
      },
      error: (error) => {
        console.error('Error loading tones:', error);
        this.tones = this.getDefaultTones();
      }
    });
  }

  /**
   * Load available audiences from API
   */
  loadAudiences(): void {
    this.emailService.getAudiences().subscribe({
      next: (audiences) => {
        this.audiences = audiences;
      },
      error: (error) => {
        console.error('Error loading audiences:', error);
        this.audiences = this.getDefaultAudiences();
      }
    });
  }

  /**
   * Load email templates from API
   */
  loadTemplates(): void {
    this.emailService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.templates = this.getDefaultTemplates();
      }
    });
  }

  /**
   * Check API health status
   */
  checkApiHealth(): void {
    this.emailService.checkHealth().subscribe({
      next: (response) => {
        console.log('API Health Check:', response);
      },
      error: (error) => {
        console.error('API Health Check Failed:', error);
        this.errorMessage = 'Backend API is not responding. Please ensure the server is running.';
      }
    });
  }

  /**
   * Handle send button click
   */
  onSend(): void {
    if (!this.inputText.trim() || this.isGenerating) {
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: this.inputText,
      tone: this.selectedTone,
      audience: this.selectedAudience,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const userPrompt = this.inputText;
    this.inputText = '';
    this.errorMessage = '';
    this.isGenerating = true;

    // Call API to generate email
    const request: EmailRequest = {
      prompt: userPrompt,
      tone: this.selectedTone,
      audience: this.selectedAudience
    };

    this.emailService.generateEmail(request).subscribe({
      next: (response) => {
        this.isGenerating = false;
        
        if (response.success && response.email) {
          const aiMessage: Message = {
            id: Date.now() + 1,
            type: 'ai',
            content: response.email,
            timestamp: new Date()
          };
          this.messages.push(aiMessage);
          this.lastGeneratedEmail = response.email;
        } else {
          this.errorMessage = response.error || 'Failed to generate email';
        }
      },
      error: (error) => {
        this.isGenerating = false;
        this.errorMessage = error.message || 'An error occurred while generating the email';
        console.error('Generation error:', error);
      }
    });
  }

  /**
   * Select a template
   */
  selectTemplate(template: Template): void {
    this.inputText = template.prompt;
  }

  /**
   * Copy email to clipboard
   */
  copyToClipboard(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  }

  /**
   * Reset conversation
   */
  reset(): void {
    this.messages = [];
    this.lastGeneratedEmail = '';
    this.inputText = '';
    this.errorMessage = '';
  }

  /**
   * Get icon for audience type
   */
  getAudienceIcon(audienceId: string): LucideIconData {
    const iconMap: Record<string, LucideIconData> = {
      'professor': this.GraduationCap,
      'student': this.User,
      'coach': this.Users,
      'professional': this.Briefcase
    };
    return iconMap[audienceId] || this.User;
  }

  /**
   * Handle Enter key in input
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  /**
   * Default fallback data
   */
  private getDefaultTones(): Tone[] {
    return [
      { id: 'professional', label: 'Professional', color: 'bg-blue-500' },
      { id: 'friendly', label: 'Friendly', color: 'bg-green-500' },
      { id: 'formal', label: 'Formal', color: 'bg-purple-500' },
      { id: 'persuasive', label: 'Persuasive', color: 'bg-orange-500' }
    ];
  }

  private getDefaultAudiences(): Audience[] {
    return [
      { id: 'professor', label: 'Professor', icon: 'graduation-cap' },
      { id: 'student', label: 'Student', icon: 'user' },
      { id: 'coach', label: 'Coach/Trainer', icon: 'users' },
      { id: 'professional', label: 'Professional', icon: 'briefcase' }
    ];
  }

  private getDefaultTemplates(): Template[] {
    return [
      { id: 'thank-you', name: 'Thank You Email', prompt: 'Write a thank you email' },
      { id: 'meeting-request', name: 'Meeting Request', prompt: 'Request a meeting' },
      { id: 'follow-up', name: 'Follow Up', prompt: 'Write a follow-up email' },
      { id: 'introduction', name: 'Introduction', prompt: 'Write an introduction email' }
    ];
  }
}