import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { 
  Mail, Send, Copy, RotateCcw, GraduationCap, 
  User, Users, Briefcase, LucideAngularModule, LucideIconData,
  Edit3, LogIn, LogOut
} from 'lucide-angular';
import { EmailService } from './services/email.service';
import { 
  Message, Tone, Audience, Template, 
  EmailRequest, EmailResponse
} from './models/email.model';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../environments/environment';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [EmailService]
})
export class AppComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private shouldScrollToBottom = false;

  // Lucide icons
  readonly Mail = Mail;
  readonly Send = Send;
  readonly Copy = Copy;
  readonly RotateCcw = RotateCcw;
  readonly GraduationCap = GraduationCap;
  readonly User = User;
  readonly Users = Users;
  readonly Briefcase = Briefcase;
  readonly Edit3 = Edit3;
  readonly LogIn = LogIn;
  readonly LogOut = LogOut;

  // Auth observables
  get isAuthenticated$() {
    return this.auth.isAuthenticated$;
  }
  get user$() {
    return this.auth.user$;
  }

  // Component state
  messages: Message[] = [];
  inputText: string = '';
  selectedTone: string = 'professional';
  selectedAudience: string = 'professor';
  selectedTemplate: string = '';
  customTone: string = '';
  customAudience: string = '';
  isCustomTone: boolean = false;
  isCustomAudience: boolean = false;
  isGenerating: boolean = false;
  lastGeneratedEmail: string = '';
  errorMessage: string = '';
  showCopySuccess: boolean = false;

  // Data
  tones: Tone[] = [];
  audiences: Audience[] = [];
  templates: Template[] = [];

  private accessToken: string | null = null;

  constructor(
    private emailService: EmailService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTones();
    this.loadAudiences();
    this.loadTemplates();
    this.checkApiHealth();

    // Fetch token only when authenticated state changes and accessToken is null
    this.auth.isAuthenticated$.pipe(distinctUntilChanged()).subscribe(isAuth => {
      if (isAuth && !this.accessToken) {
        this.auth.getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://aica-backend-api'
          }
        }).subscribe({
          next: (token) => {
            this.accessToken = token;
          },
          error: () => {
            // Suppress specific token retrieval errors
          }
        });
      }
    });
  }

  login(): void {
    this.auth.loginWithRedirect({
      authorizationParams: {
        audience: environment.auth0.authorizationParams.audience,
        scope: 'openid profile email',
      },
    });
  }

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (error) {
      console.error('Scroll error:', error);
    }
  }

  loadTones(): void {
    this.emailService.getTones().subscribe({
      next: (tones) => this.tones = tones,
      error: () => this.tones = this.getDefaultTones()
    });
  }

  loadAudiences(): void {
    this.emailService.getAudiences().subscribe({
      next: (audiences) => this.audiences = audiences,
      error: () => this.audiences = this.getDefaultAudiences()
    });
  }

  loadTemplates(): void {
    this.emailService.getTemplates().subscribe({
      next: (templates) => this.templates = templates,
      error: () => this.templates = this.getDefaultTemplates()
    });
  }

  checkApiHealth(): void {
    this.emailService.checkHealth().subscribe({
      next: () => {},
      error: () => {
        this.errorMessage = 'Unable to reach the backend service.';
      }
    });
  }

  toggleCustomTone(): void {
    this.isCustomTone = !this.isCustomTone;
    if (this.isCustomTone) this.customTone = '';
  }

  toggleCustomAudience(): void {
    this.isCustomAudience = !this.isCustomAudience;
    if (this.isCustomAudience) this.customAudience = '';
  }

  selectTone(toneId: string): void {
    this.selectedTone = toneId;
    this.isCustomTone = false;
    this.customTone = '';
  }

  selectAudience(audienceId: string): void {
    this.selectedAudience = audienceId;
    this.isCustomAudience = false;
    this.customAudience = '';
  }

  getCurrentTone(): string {
    return this.isCustomTone && this.customTone.trim()
      ? this.customTone.trim()
      : this.selectedTone;
  }

  getCurrentAudience(): string {
    return this.isCustomAudience && this.customAudience.trim()
      ? this.customAudience.trim()
      : this.selectedAudience;
  }

  async onSend(): Promise<void> {
    if (!this.inputText.trim() || this.isGenerating) return;

    const tone = this.getCurrentTone();
    const audience = this.getCurrentAudience();

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: this.inputText,
      tone,
      audience,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    const request: EmailRequest = {
      prompt: this.inputText,
      tone,
      audience
    };

    this.inputText = '';
    this.errorMessage = '';
    this.isGenerating = true;

    try {
      const response: EmailResponse = await this.emailService.generateEmail(request, this.accessToken ?? undefined);
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
        this.shouldScrollToBottom = true;
      } else {
        this.errorMessage = 'Unable to generate an email at this time.';
      }
    } catch {
      this.isGenerating = false;
      this.errorMessage = 'A problem occurred while generating your email.';
    }
  }

  selectTemplate(template: Template): void {
    this.inputText = template.prompt;
    this.selectedTemplate = template.id;
  }

  copyToClipboard(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      this.showCopySuccess = true;
      setTimeout(() => this.showCopySuccess = false, 2000);
    });
  }

  reset(): void {
    this.messages = [];
    this.lastGeneratedEmail = '';
    this.inputText = '';
    this.errorMessage = '';
    this.isCustomTone = false;
    this.isCustomAudience = false;
    this.customTone = '';
    this.customAudience = '';
    this.selectedTone = 'professional';
    this.selectedAudience = 'professor';
    this.selectedTemplate = '';
  }

  getAudienceIcon(audienceId: string): LucideIconData {
    const iconMap: Record<string, LucideIconData> = {
      'professor': this.GraduationCap,
      'student': this.User,
      'coach': this.Users,
      'professional': this.Briefcase
    };
    return iconMap[audienceId] || this.User;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

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
