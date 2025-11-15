import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  Mail, Send, Copy, RotateCcw, GraduationCap, 
  User, Users, Briefcase, LucideAngularModule, LucideIconData,
  Edit3, LogIn, LogOut, Moon, Sun, Save, Settings, X, Trash2, Star, Plus
} from 'lucide-angular';
import { EmailService } from './services/email.service';
import { PreferencesService } from './services/preferences.service';
import { ThemeService } from './services/theme.service';
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
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [EmailService, PreferencesService]
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
  readonly Moon = Moon;
  readonly Sun = Sun;
  readonly Save = Save;
  readonly Settings = Settings;
  readonly X = X;
  readonly Trash2 = Trash2;
  readonly Star = Star;
  readonly Plus = Plus;

  // Auth observables
  get isAuthenticated$() {
    return this.auth.isAuthenticated$;
  }
  get user$() {
    return this.auth.user$;
  }

  // Theme observable
  get theme$() {
    return this.themeService.theme$;
  }

  // Component state
  messages: Message[] = [];
  inputText: string = '';
  selectedTone: string = '';
  selectedAudience: string = '';
  selectedTemplate: string = '';
  customTone: string = '';
  customAudience: string = '';
  customTemplate: string = '';
  customTemplateName: string = '';
  isCustomTone: boolean = false;
  isCustomAudience: boolean = false;
  isCustomTemplate: boolean = false;
  isGenerating: boolean = false;
  lastGeneratedEmail: string = '';
  errorMessage: string = '';
  showCopySuccess: boolean = false;
  showSaveSuccess: boolean = false;
  showSettingsModal: boolean = false;

  // Email editing state
  editingEmailId: string | null = null;
  editingEmailSubject: string = '';
  editingEmailContent: string = '';
  editingEmailTone: string = '';
  editingEmailAudience: string = '';

  // Manual email add state
  showManualEmailAdd: boolean = false;
  manualEmailSubject: string = '';
  manualEmailContent: string = '';
  manualEmailTone: string = '';
  manualEmailAudience: string = '';

  // Add/Edit state for tones, audiences, templates
  showAddTone: boolean = false;
  newToneLabel: string = '';
  newToneDescription: string = '';
  
  showAddAudience: boolean = false;
  newAudienceLabel: string = '';
  newAudienceDescription: string = '';
  
  showAddTemplate: boolean = false;
  newTemplateName: string = '';
  newTemplatePrompt: string = '';
  
  editingToneId: string | null = null;
  editingToneLabel: string = '';
  editingToneDescription: string = '';
  
  editingAudienceId: string | null = null;
  editingAudienceLabel: string = '';
  editingAudienceDescription: string = '';
  
  editingTemplateId: string | null = null;
  editingTemplateName: string = '';
  editingTemplatePrompt: string = '';

  // Data
  tones: Tone[] = [];
  audiences: Audience[] = [];
  templates: Template[] = [];

  private accessToken: string | null = null;

  constructor(
    private emailService: EmailService,
    public preferencesService: PreferencesService,
    private themeService: ThemeService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTones();
    this.loadAudiences();
    this.loadTemplates();
    this.checkApiHealth();

    // Subscribe to preferences from MongoDB
    this.preferencesService.tones$.subscribe(tones => {
      if (tones.length > 0) {
        this.tones = tones;
      }
    });

    this.preferencesService.audiences$.subscribe(audiences => {
      if (audiences.length > 0) {
        this.audiences = audiences;
      }
    });

    this.preferencesService.templates$.subscribe(templates => {
      if (templates.length > 0) {
        this.templates = templates;
      }
    });

    // Fetch token and load preferences when authenticated
    this.auth.isAuthenticated$.pipe(distinctUntilChanged()).subscribe(isAuth => {
      if (isAuth && !this.accessToken) {
        this.auth.getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://aica-backend-api'
          }
        }).subscribe({
          next: async (token) => {
            this.accessToken = token;
            const success = await this.preferencesService.loadUserPreferences(token);
            if (!success) {
              console.log('⚠️ Failed to load preferences, using defaults');
            }
          },
          error: (err) => {
            console.error('❌ Token error:', err);
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSettingsModal(): void {
    this.showSettingsModal = !this.showSettingsModal;
  }

  closeSettingsModal(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.showSettingsModal = false;
    }
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

  toggleCustomTemplate(): void {
    this.isCustomTemplate = !this.isCustomTemplate;
    if (this.isCustomTemplate) {
      this.customTemplate = this.inputText;
      this.customTemplateName = '';
      this.selectedTemplate = '';
    } else {
      this.inputText = this.customTemplate;
      this.customTemplate = '';
      this.customTemplateName = '';
    }
  }

  onCustomTemplateChange(): void {
    if (this.isCustomTemplate) {
      this.inputText = this.customTemplate;
    }
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

  toggleTone(toneId: string): void {
    if (this.selectedTone === toneId) {
      this.selectedTone = '';
    } else {
      this.selectedTone = toneId;
    }
    this.isCustomTone = false;
    this.customTone = '';
  }

  toggleAudience(audienceId: string): void {
    if (this.selectedAudience === audienceId) {
      this.selectedAudience = '';
    } else {
      this.selectedAudience = audienceId;
    }
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

  getCurrentPrompt(): string {
    if (this.isCustomTemplate && this.customTemplate.trim()) {
      return this.customTemplate.trim();
    }
    return this.inputText.trim();
  }

  canSend(): boolean {
    const hasPrompt = this.getCurrentPrompt().length > 0;
    return hasPrompt && !this.isGenerating;
  }

  async onSend(): Promise<void> {
    const promptText = this.getCurrentPrompt();
    
    if (!promptText || this.isGenerating) return;

    const tone = this.getCurrentTone();
    const audience = this.getCurrentAudience();

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: promptText,
      tone,
      audience,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    const request: EmailRequest = {
      prompt: promptText,
      tone,
      audience
    };

    this.inputText = '';
    this.customTemplate = '';
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
    if (this.selectedTemplate === template.id) {
      this.selectedTemplate = '';
      this.inputText = '';
      this.isCustomTemplate = false;
      this.customTemplate = '';
    } else {
      this.inputText = template.prompt;
      this.selectedTemplate = template.id;
      this.isCustomTemplate = false;
      this.customTemplate = '';
    }
  }

  copyToClipboard(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      this.showCopySuccess = true;
      setTimeout(() => this.showCopySuccess = false, 2000);
    });
  }

  async saveEmailToLibrary(content: string): Promise<void> {
    if (!this.accessToken) {
      this.errorMessage = 'Please sign in to save emails';
      return;
    }

    const subjectMatch = content.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Untitled Email';

    const lastUserMessage = [...this.messages].reverse().find(m => m.type === 'user');
    const tone = lastUserMessage?.tone || 'professional';
    const audience = lastUserMessage?.audience || 'professional';

    const success = await this.preferencesService.saveEmail(this.accessToken, {
      subject,
      content,
      tone,
      audience,
      source: 'ai'
    });

    if (success) {
      this.showSaveSuccess = true;
      this.errorMessage = '';
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to save email to library';
    }
  }

  // Save custom tone
  async saveCustomTone(): Promise<void> {
    if (!this.accessToken || !this.customTone.trim()) return;

    const newTone: Tone = {
      id: `custom-${Date.now()}`,
      label: this.customTone.trim(),
      color: 'bg-orange-500',
      description: 'Custom tone'
    };

    const success = await this.preferencesService.addTone(this.accessToken, newTone);
    
    if (success) {
      this.customTone = '';
      this.isCustomTone = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to save tone. Maximum 5 tones allowed.';
    }
  }

  // Save custom audience
  async saveCustomAudience(): Promise<void> {
    if (!this.accessToken || !this.customAudience.trim()) return;

    const newAudience: Audience = {
      id: `custom-${Date.now()}`,
      label: this.customAudience.trim(),
      icon: 'user',
      description: 'Custom audience'
    };

    const success = await this.preferencesService.updateAudiences(
      this.accessToken, 
      [...this.audiences, newAudience]
    );
    
    if (success) {
      this.customAudience = '';
      this.isCustomAudience = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to save audience. Maximum 4 audiences allowed.';
    }
  }

  // Save custom template
  async saveCustomTemplate(): Promise<void> {
    if (!this.accessToken || !this.customTemplate.trim() || !this.customTemplateName.trim()) return;

    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: this.customTemplateName.trim(),
      prompt: this.customTemplate.trim(),
      isCustom: true
    };

    const success = await this.preferencesService.addTemplate(this.accessToken, newTemplate);
    
    if (success) {
      this.customTemplate = '';
      this.customTemplateName = '';
      this.isCustomTemplate = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to save template. Maximum 6 templates allowed.';
    }
  }

  // ==================== DELETE METHODS ====================
  
  // Delete tone from settings
  async deleteToneFromSettings(toneId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteTone(this.accessToken, toneId);
    
    if (!success) {
      this.errorMessage = 'Failed to delete tone. Minimum 4 tones required.';
    }
  }

  // Delete audience from settings - CORRECTED
  async deleteAudienceFromSettings(audienceId: string): Promise<void> {
    if (!this.accessToken) return;

    const updatedAudiences = this.audiences.filter(a => a.id !== audienceId);

    if (updatedAudiences.length < 4) {
      this.errorMessage = 'Minimum 4 audiences required.';
      return;
    }

    const success = await this.preferencesService.updateAudiences(this.accessToken, updatedAudiences);
    
    if (!success) {
      this.errorMessage = 'Failed to delete audience.';
    }
  }

  // Delete template from settings
  async deleteTemplateFromSettings(templateId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteTemplate(this.accessToken, templateId);
    
    if (!success) {
      this.errorMessage = 'Failed to delete template. Minimum 6 templates required.';
    }
  }

  // Delete email from library
  async deleteEmailFromLibrary(emailId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteEmail(this.accessToken, emailId);
    
    if (!success) {
      this.errorMessage = 'Failed to delete email from library.';
    }
  }

  // Toggle email favorite
  async toggleFavorite(emailId: string): Promise<void> {
    if (!this.accessToken) return;

    await this.preferencesService.toggleEmailFavorite(this.accessToken, emailId);
  }

  // Start editing an email
  startEditingEmail(email: any): void {
    this.editingEmailId = email.id;
    this.editingEmailSubject = email.subject;
    this.editingEmailContent = email.content;
    this.editingEmailTone = email.tone;
    this.editingEmailAudience = email.audience;
  }

  // Cancel editing
  cancelEditingEmail(): void {
    this.editingEmailId = null;
    this.editingEmailSubject = '';
    this.editingEmailContent = '';
    this.editingEmailTone = '';
    this.editingEmailAudience = '';
  }

  // Save edited email
  async saveEditedEmail(emailId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.updateEmail(this.accessToken, emailId, {
      subject: this.editingEmailSubject,
      content: this.editingEmailContent,
      tone: this.editingEmailTone,
      audience: this.editingEmailAudience,
      source: 'manual'
    });

    if (success) {
      this.cancelEditingEmail();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to save edited email.';
    }
  }

  // Reset preferences to defaults
  async resetPreferencesToDefaults(): Promise<void> {
    if (!this.accessToken) return;

    if (confirm('Are you sure you want to reset all preferences to defaults? This will delete all custom tones, audiences, templates, and saved emails.')) {
      const success = await this.preferencesService.resetToDefaults(this.accessToken);
      
      if (success) {
        this.showSaveSuccess = true;
        setTimeout(() => this.showSaveSuccess = false, 2000);
      } else {
        this.errorMessage = 'Failed to reset preferences.';
      }
    }
  }

  // Toggle manual email add form
  toggleManualEmailAdd(): void {
    this.showManualEmailAdd = !this.showManualEmailAdd;
    if (this.showManualEmailAdd) {
      this.manualEmailSubject = '';
      this.manualEmailContent = '';
      this.manualEmailTone = '';
      this.manualEmailAudience = '';
    }
  }

  // Cancel manual email add
  cancelManualEmailAdd(): void {
    this.showManualEmailAdd = false;
    this.manualEmailSubject = '';
    this.manualEmailContent = '';
    this.manualEmailTone = '';
    this.manualEmailAudience = '';
  }

  // Check if manual email can be saved
  canSaveManualEmail(): boolean {
    return this.manualEmailSubject.trim().length > 0 &&
           this.manualEmailContent.trim().length > 0 &&
           this.manualEmailTone.trim().length > 0 &&
           this.manualEmailAudience.trim().length > 0;
  }

  // Save manual email
  async saveManualEmail(): Promise<void> {
    if (!this.accessToken || !this.canSaveManualEmail()) return;

    const success = await this.preferencesService.saveEmail(this.accessToken, {
      subject: this.manualEmailSubject.trim(),
      content: this.manualEmailContent.trim(),
      tone: this.manualEmailTone.trim(),
      audience: this.manualEmailAudience.trim(),
      source: 'manual'
    });

    if (success) {
      this.cancelManualEmailAdd();
      this.showSaveSuccess = true;
      this.errorMessage = '';
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to save email to library';
    }
  }

  // ==================== TONE MANAGEMENT ====================
  
  toggleAddTone(): void {
    this.showAddTone = !this.showAddTone;
    if (this.showAddTone) {
      this.newToneLabel = '';
      this.newToneDescription = '';
    }
  }

  cancelAddTone(): void {
    this.showAddTone = false;
    this.newToneLabel = '';
    this.newToneDescription = '';
  }

  canSaveNewTone(): boolean {
    return this.newToneLabel.trim().length > 0;
  }

  async saveNewTone(): Promise<void> {
    if (!this.accessToken || !this.canSaveNewTone()) return;

    const newTone: Tone = {
      id: `custom-${Date.now()}`,
      label: this.newToneLabel.trim(),
      color: 'bg-orange-500',
      description: this.newToneDescription.trim() || 'Custom tone'
    };

    const success = await this.preferencesService.addTone(this.accessToken, newTone);
    
    if (success) {
      this.cancelAddTone();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to add tone. Maximum 5 tones allowed.';
    }
  }

  startEditingTone(tone: Tone): void {
    this.editingToneId = tone.id;
    this.editingToneLabel = tone.label;
    this.editingToneDescription = tone.description || '';
  }

  cancelEditingTone(): void {
    this.editingToneId = null;
    this.editingToneLabel = '';
    this.editingToneDescription = '';
  }

  async saveEditedTone(toneId: string): Promise<void> {
    if (!this.accessToken) return;

    const updatedTones = this.tones.map(t => 
      t.id === toneId 
        ? { ...t, label: this.editingToneLabel.trim(), description: this.editingToneDescription.trim() }
        : t
    );

    const success = await this.preferencesService.updateTones(this.accessToken, updatedTones);
    
    if (success) {
      this.cancelEditingTone();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to update tone.';
    }
  }

  // ==================== AUDIENCE MANAGEMENT ====================
  
  toggleAddAudience(): void {
    this.showAddAudience = !this.showAddAudience;
    if (this.showAddAudience) {
      this.newAudienceLabel = '';
      this.newAudienceDescription = '';
    }
  }

  cancelAddAudience(): void {
    this.showAddAudience = false;
    this.newAudienceLabel = '';
    this.newAudienceDescription = '';
  }

  canSaveNewAudience(): boolean {
    return this.newAudienceLabel.trim().length > 0;
  }

  async saveNewAudience(): Promise<void> {
    if (!this.accessToken || !this.canSaveNewAudience()) return;

    const newAudience: Audience = {
      id: `custom-${Date.now()}`,
      label: this.newAudienceLabel.trim(),
      icon: 'user',
      description: this.newAudienceDescription.trim() || 'Custom audience'
    };

    const success = await this.preferencesService.updateAudiences(
      this.accessToken, 
      [...this.audiences, newAudience]
    );
    
    if (success) {
      this.cancelAddAudience();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to add audience. Maximum 4 audiences allowed.';
    }
  }

  startEditingAudience(audience: Audience): void {
    this.editingAudienceId = audience.id;
    this.editingAudienceLabel = audience.label;
    this.editingAudienceDescription = audience.description || '';
  }

  cancelEditingAudience(): void {
    this.editingAudienceId = null;
    this.editingAudienceLabel = '';
    this.editingAudienceDescription = '';
  }

  async saveEditedAudience(audienceId: string): Promise<void> {
    if (!this.accessToken) return;

    const updatedAudiences = this.audiences.map(a => 
      a.id === audienceId 
        ? { ...a, label: this.editingAudienceLabel.trim(), description: this.editingAudienceDescription.trim() }
        : a
    );

    const success = await this.preferencesService.updateAudiences(this.accessToken, updatedAudiences);
    
    if (success) {
      this.cancelEditingAudience();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to update audience.';
    }
  }

  // ==================== TEMPLATE MANAGEMENT ====================
  
  toggleAddTemplate(): void {
    this.showAddTemplate = !this.showAddTemplate;
    if (this.showAddTemplate) {
      this.newTemplateName = '';
      this.newTemplatePrompt = '';
    }
  }

  cancelAddTemplate(): void {
    this.showAddTemplate = false;
    this.newTemplateName = '';
    this.newTemplatePrompt = '';
  }

  canSaveNewTemplate(): boolean {
    return this.newTemplateName.trim().length > 0 && this.newTemplatePrompt.trim().length > 0;
  }

  async saveNewTemplate(): Promise<void> {
    if (!this.accessToken || !this.canSaveNewTemplate()) return;

    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: this.newTemplateName.trim(),
      prompt: this.newTemplatePrompt.trim(),
      isCustom: true
    };

    const success = await this.preferencesService.addTemplate(this.accessToken, newTemplate);
    
    if (success) {
      this.cancelAddTemplate();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to add template. Maximum 6 templates allowed.';
    }
  }

  startEditingTemplate(template: Template): void {
    this.editingTemplateId = template.id;
    this.editingTemplateName = template.name;
    this.editingTemplatePrompt = template.prompt;
  }

  cancelEditingTemplate(): void {
    this.editingTemplateId = null;
    this.editingTemplateName = '';
    this.editingTemplatePrompt = '';
  }

  async saveEditedTemplate(templateId: string): Promise<void> {
    if (!this.accessToken) return;

    const updatedTemplates = this.templates.map(t => 
      t.id === templateId 
        ? { ...t, name: this.editingTemplateName.trim(), prompt: this.editingTemplatePrompt.trim() }
        : t
    );

    const success = await this.preferencesService.updateTemplates(this.accessToken, updatedTemplates);
    
    if (success) {
      this.cancelEditingTemplate();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.errorMessage = 'Failed to update template.';
    }
  }

  reset(): void {
    this.messages = [];
    this.lastGeneratedEmail = '';
    this.inputText = '';
    this.errorMessage = '';
    this.isCustomTone = false;
    this.isCustomAudience = false;
    this.isCustomTemplate = false;
    this.customTone = '';
    this.customAudience = '';
    this.customTemplate = '';
    this.customTemplateName = '';
    this.selectedTone = '';
    this.selectedAudience = '';
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