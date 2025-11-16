import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  Mail, Send, Copy, RotateCcw, GraduationCap, 
  User, Users, Briefcase, LucideAngularModule, LucideIconData,
  Edit3, LogIn, LogOut, Moon, Sun, Save, Settings, X, Trash2, Star, 
  Plus, FileSignature
} from 'lucide-angular';
import { EmailService } from './services/email.service';
import { PreferencesService } from './services/preferences.service';
import { ThemeService } from './services/theme.service';
import { 
  Message, Tone, Audience, Template, 
  EmailRequest, EmailResponse,
  Signature
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
export class AppComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private shouldScrollToBottom = false;
  private errorTimeout: any = null;

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
  readonly FileSignature = FileSignature;

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

  // Signature state
  signatures: Signature[] = [];
  selectedSignatureId: string = '';
  showAddSignature: boolean = false;
  newSignatureName: string = '';
  newSignatureContent: string = '';
  editingSignatureId: string | null = null;
  editingSignatureName: string = '';
  editingSignatureContent: string = '';
  isCustomSignature: boolean = false; // NEW: Add this line
  customSignatureName: string = ''; // NEW: Add this line
  customSignatureContent: string = ''; // NEW: Add this line

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

  ngOnDestroy(): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

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

    this.preferencesService.signatures$.subscribe(signatures => {
      if (signatures.length > 0) {
        this.signatures = signatures;
        // Auto-select default signature
        const defaultSig = signatures.find(s => s.isDefault);
        if (defaultSig) {
          this.selectedSignatureId = defaultSig.id;
        }
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

  private setErrorMessage(message: string): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    
    this.errorMessage = message;
    
    this.errorTimeout = setTimeout(() => {
      this.errorMessage = '';
      this.errorTimeout = null;
    }, 3000);
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
        this.setErrorMessage('Unable to reach the backend service.');
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

  // NEW: Add this method
  toggleCustomSignature(): void {
    this.isCustomSignature = !this.isCustomSignature;
    if (this.isCustomSignature) {
      this.customSignatureName = '';
      this.customSignatureContent = '';
      this.selectedSignatureId = '';
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
    if (this.isCustomTone && this.customTone.trim()) {
      return this.customTone.trim().toLowerCase();
    }
    if (this.selectedTone) {
      const tone = this.tones.find(t => t.id === this.selectedTone);
      return tone ? tone.label.toLowerCase() : this.selectedTone.toLowerCase();
    }
    return '';
  }

  getCurrentAudience(): string {
    if (this.isCustomAudience && this.customAudience.trim()) {
      return this.customAudience.trim().toLowerCase();
    }
    if (this.selectedAudience) {
      const audience = this.audiences.find(a => a.id === this.selectedAudience);
      return audience ? audience.label.toLowerCase() : this.selectedAudience.toLowerCase();
    }
    return '';
  }

  getCurrentPrompt(): string {
    if (this.isCustomTemplate && this.customTemplate.trim()) {
      return this.customTemplate.trim();
    }
    return this.inputText.trim();
  }

  getCurrentSignature(): string {
    // NEW: Update this method to handle custom signatures
    if (this.isCustomSignature && this.customSignatureName.trim()) {
      return this.customSignatureName.trim().toLowerCase();
    }
    if (!this.selectedSignatureId) return '';
    const signature = this.signatures.find(s => s.id === this.selectedSignatureId);
    return signature ? signature.name.toLowerCase() : '';
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
    const signatureName = this.getCurrentSignature();

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: promptText,
      tone,
      audience,
      signature: signatureName,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    const request: EmailRequest = {
      prompt: promptText,
      tone: this.selectedTone || this.customTone,
      audience: this.selectedAudience || this.customAudience
    };

    this.inputText = '';
    this.customTemplate = '';
    this.errorMessage = '';
    this.isGenerating = true;

    try {
      const response: EmailResponse = await this.emailService.generateEmail(request, this.accessToken ?? undefined);
      this.isGenerating = false;

      if (response.success && response.email) {
        let emailContent = response.email;
        
        // NEW: Apply custom or saved signature
        if (this.isCustomSignature && this.customSignatureContent.trim()) {
          emailContent = this.applyCustomSignatureToEmail(emailContent, this.customSignatureContent);
        } else if (this.selectedSignatureId) {
          emailContent = this.applySignatureToEmail(emailContent);
        }
        
        const aiMessage: Message = {
          id: Date.now() + 1,
          type: 'ai',
          content: emailContent,
          timestamp: new Date()
        };
        this.messages.push(aiMessage);
        this.lastGeneratedEmail = emailContent;
        this.shouldScrollToBottom = true;
      } else {
        this.setErrorMessage('Unable to generate an email at this time.');
      }
    } catch {
      this.isGenerating = false;
      this.setErrorMessage('A problem occurred while generating your email.');
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
      this.setErrorMessage('Please sign in to save emails');
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
      this.setErrorMessage('Failed to save email. Maximum 8 saved emails allowed.');
    }
  }

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
      this.selectedTone = newTone.id;
      this.customTone = '';
      this.isCustomTone = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to save tone. Maximum 8 tones allowed.');
    }
  }

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
      this.selectedAudience = newAudience.id;
      this.customAudience = '';
      this.isCustomAudience = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to save audience. Maximum 8 audiences allowed.');
    }
  }

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
      this.selectedTemplate = newTemplate.id;
      this.inputText = newTemplate.prompt;
      this.customTemplate = '';
      this.customTemplateName = '';
      this.isCustomTemplate = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to save template. Maximum 8 templates allowed.');
    }
  }

  // NEW: Add this method to save custom signature
  async saveCustomSignature(): Promise<void> {
    if (!this.accessToken || !this.customSignatureName.trim() || !this.customSignatureContent.trim()) return;

    const newSignature: Signature = {
      id: `custom-${Date.now()}`,
      name: this.customSignatureName.trim(),
      content: this.customSignatureContent.trim(),
      isDefault: this.signatures.length === 0
    };

    const success = await this.preferencesService.addSignature(this.accessToken, newSignature);
    
    if (success) {
      this.selectedSignatureId = newSignature.id;
      this.customSignatureName = '';
      this.customSignatureContent = '';
      this.isCustomSignature = false;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to save signature. Maximum 8 signatures allowed.');
    }
  }

  async deleteToneFromSettings(toneId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteTone(this.accessToken, toneId);
    
    if (!success) {
      this.setErrorMessage('Failed to delete tone. Minimum 1 tone required.');
    }
  }

  async deleteAudienceFromSettings(audienceId: string): Promise<void> {
    if (!this.accessToken) return;

    const updatedAudiences = this.audiences.filter(a => a.id !== audienceId);

    if (updatedAudiences.length < 1) {
      this.setErrorMessage('Minimum 1 audience required.');
      return;
    }

    const success = await this.preferencesService.updateAudiences(this.accessToken, updatedAudiences);
    
    if (!success) {
      this.setErrorMessage('Failed to delete audience.');
    }
  }

  async deleteTemplateFromSettings(templateId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteTemplate(this.accessToken, templateId);
    
    if (!success) {
      this.setErrorMessage('Failed to delete template. Minimum 1 template required.');
    }
  }

  async deleteEmailFromLibrary(emailId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteEmail(this.accessToken, emailId);
    
    if (!success) {
      this.setErrorMessage('Failed to delete email from library.');
    }
  }

  async toggleFavorite(emailId: string): Promise<void> {
    if (!this.accessToken) return;

    await this.preferencesService.toggleEmailFavorite(this.accessToken, emailId);
  }

  startEditingEmail(email: any): void {
    this.editingEmailId = email.id;
    this.editingEmailSubject = email.subject;
    this.editingEmailContent = email.content;
    this.editingEmailTone = email.tone;
    this.editingEmailAudience = email.audience;
  }

  cancelEditingEmail(): void {
    this.editingEmailId = null;
    this.editingEmailSubject = '';
    this.editingEmailContent = '';
    this.editingEmailTone = '';
    this.editingEmailAudience = '';
  }

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
      this.setErrorMessage('Failed to save edited email.');
    }
  }

  async resetPreferencesToDefaults(): Promise<void> {
    if (!this.accessToken) return;

    if (confirm('Are you sure you want to reset all preferences to defaults? This will delete all custom tones, audiences, templates, and saved emails.')) {
      const success = await this.preferencesService.resetToDefaults(this.accessToken);
      
      if (success) {
        this.showSaveSuccess = true;
        setTimeout(() => this.showSaveSuccess = false, 2000);
      } else {
        this.setErrorMessage('Failed to reset preferences.');
      }
    }
  }

  toggleManualEmailAdd(): void {
    this.showManualEmailAdd = !this.showManualEmailAdd;
    if (this.showManualEmailAdd) {
      this.manualEmailSubject = '';
      this.manualEmailContent = '';
      this.manualEmailTone = '';
      this.manualEmailAudience = '';
    }
  }

  cancelManualEmailAdd(): void {
    this.showManualEmailAdd = false;
    this.manualEmailSubject = '';
    this.manualEmailContent = '';
    this.manualEmailTone = '';
    this.manualEmailAudience = '';
  }

  canSaveManualEmail(): boolean {
    return this.manualEmailSubject.trim().length > 0 &&
           this.manualEmailContent.trim().length > 0 &&
           this.manualEmailTone.trim().length > 0 &&
           this.manualEmailAudience.trim().length > 0;
  }

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
      this.setErrorMessage('Failed to save email. Maximum 8 saved emails allowed.');
    }
  }

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
      this.setErrorMessage('Failed to add tone. Maximum 8 tones allowed.');
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
      this.setErrorMessage('Failed to update tone.');
    }
  }

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
      this.setErrorMessage('Failed to add audience. Maximum 8 audiences allowed.');
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
      this.setErrorMessage('Failed to update audience.');
    }
  }

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
      this.setErrorMessage('Failed to add template. Maximum 8 templates allowed.');
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
      this.setErrorMessage('Failed to update template.');
    }
  }

  toggleAddSignature(): void {
    this.showAddSignature = !this.showAddSignature;
    if (this.showAddSignature) {
      this.newSignatureName = '';
      this.newSignatureContent = '';
    }
  }

  cancelAddSignature(): void {
    this.showAddSignature = false;
    this.newSignatureName = '';
    this.newSignatureContent = '';
  }

  canSaveNewSignature(): boolean {
    return this.newSignatureName.trim().length > 0 && 
          this.newSignatureContent.trim().length > 0;
  }

  async saveNewSignature(): Promise<void> {
    if (!this.accessToken || !this.canSaveNewSignature()) return;

    const newSignature: Signature = {
      id: `signature-${Date.now()}`,
      name: this.newSignatureName.trim(),
      content: this.newSignatureContent.trim(),
      isDefault: this.signatures.length === 0
    };

    const success = await this.preferencesService.addSignature(this.accessToken, newSignature);
    
    if (success) {
      this.selectedSignatureId = newSignature.id;
      this.cancelAddSignature();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to add signature. Maximum 8 signatures allowed.');
    }
  }

  startEditingSignature(signature: Signature): void {
    this.editingSignatureId = signature.id;
    this.editingSignatureName = signature.name;
    this.editingSignatureContent = signature.content;
  }

  cancelEditingSignature(): void {
    this.editingSignatureId = null;
    this.editingSignatureName = '';
    this.editingSignatureContent = '';
  }

  async saveEditedSignature(signatureId: string): Promise<void> {
    if (!this.accessToken) return;

    const updatedSignatures = this.signatures.map(s => 
      s.id === signatureId 
        ? { ...s, name: this.editingSignatureName.trim(), content: this.editingSignatureContent.trim() }
        : s
    );

    const success = await this.preferencesService.updateSignatures(this.accessToken, updatedSignatures);
    
    if (success) {
      this.cancelEditingSignature();
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to update signature.');
    }
  }

  async deleteSignatureFromSettings(signatureId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.deleteSignature(this.accessToken, signatureId);
    
    if (!success) {
      this.setErrorMessage('Failed to delete signature. Minimum 1 signature required.');
    }
  }

  async setAsDefaultSignature(signatureId: string): Promise<void> {
    if (!this.accessToken) return;

    const success = await this.preferencesService.setDefaultSignature(this.accessToken, signatureId);
    
    if (success) {
      this.selectedSignatureId = signatureId;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2000);
    } else {
      this.setErrorMessage('Failed to set default signature.');
    }
  }

  applySignatureToEmail(emailContent: string): string {
    const signature = this.signatures.find(s => s.id === this.selectedSignatureId);
    if (!signature) return emailContent;

    let cleanedContent = emailContent;
    
    cleanedContent = cleanedContent.replace(/\n\n(Warm regards|Best regards|Sincerely|Kind regards|Regards|Thanks|Thank you|Cheers),?\s*\n+\[Your Name\].*$/s, '');
    cleanedContent = cleanedContent.replace(/\n+\[Your Name\].*$/s, '');
    cleanedContent = cleanedContent.replace(/\n\n(Warm regards|Best regards|Sincerely|Kind regards|Regards),?\s*$/s, '');
    cleanedContent = cleanedContent.trim();
    
    return cleanedContent + '\n\n' + signature.content;
  }

  // NEW: Add this method for custom signatures
  applyCustomSignatureToEmail(emailContent: string, customSignature: string): string {
    let cleanedContent = emailContent;
    
    cleanedContent = cleanedContent.replace(/\n\n(Warm regards|Best regards|Sincerely|Kind regards|Regards|Thanks|Thank you|Cheers),?\s*\n+\[Your Name\].*$/s, '');
    cleanedContent = cleanedContent.replace(/\n+\[Your Name\].*$/s, '');
    cleanedContent = cleanedContent.replace(/\n\n(Warm regards|Best regards|Sincerely|Kind regards|Regards),?\s*$/s, '');
    cleanedContent = cleanedContent.trim();
    
    return cleanedContent + '\n\n' + customSignature;
  }

  reset(): void {
    this.messages = [];
    this.lastGeneratedEmail = '';
    this.inputText = '';
    this.errorMessage = '';
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    this.isCustomTone = false;
    this.isCustomAudience = false;
    this.isCustomTemplate = false;
    this.isCustomSignature = false;
    this.customTone = '';
    this.customAudience = '';
    this.customTemplate = '';
    this.customTemplateName = '';
    this.customSignatureName = '';
    this.customSignatureContent = '';
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