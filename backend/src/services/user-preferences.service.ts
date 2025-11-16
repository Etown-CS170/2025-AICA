import { UserPreferences, IUserPreferences, ITone, IAudience, ITemplate, ISavedEmail, ISignature } from '../models/user-preferences.model';
import { Document } from 'mongoose';

class UserPreferencesService {
  private readonly DEFAULT_TONES: ITone[] = [
    { id: 'professional', label: 'Professional', color: 'bg-blue-500', description: 'Clear and direct' },
    { id: 'friendly', label: 'Friendly', color: 'bg-green-500', description: 'Warm and approachable' },
    { id: 'formal', label: 'Formal', color: 'bg-purple-500', description: 'Respectful and structured' },
    { id: 'persuasive', label: 'Persuasive', color: 'bg-orange-500', description: 'Compelling' }
  ];

  private readonly DEFAULT_AUDIENCES: IAudience[] = [
    { id: 'professor', label: 'Professor', icon: 'graduation-cap' },
    { id: 'student', label: 'Student', icon: 'user' },
    { id: 'coach', label: 'Coach/Trainer', icon: 'users' },
    { id: 'professional', label: 'Professional', icon: 'briefcase' }
  ];

  private readonly DEFAULT_TEMPLATES: ITemplate[] = [
    { id: 'thank-you', name: 'Thank You Email', prompt: 'Write a thank you email' },
    { id: 'meeting-request', name: 'Meeting Request', prompt: 'Request a meeting to discuss' },
    { id: 'follow-up', name: 'Follow Up', prompt: 'Write a follow-up email' },
    { id: 'introduction', name: 'Introduction', prompt: 'Write an introduction email' },
    { id: 'apology', name: 'Apology', prompt: 'Write an apology email for' },
    { id: 'feedback-request', name: 'Feedback Request', prompt: 'Request feedback on' }
  ];

  private readonly DEFAULT_SIGNATURES: ISignature[] = [
    {
      id: 'default-professional',
      name: 'Professional',
      content: 'Best regards,\n[Your Name]\n[Your Title]\n[Your Company]',
      isDefault: true
    }
  ];

  async getUserPreferences(userId: string): Promise<IUserPreferences> {
    let preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId) as (Document<unknown, {}, IUserPreferences> & IUserPreferences & Required<{ _id: unknown; }> & { __v: number; });
    }

    return preferences!;
  }

  async createDefaultPreferences(userId: string): Promise<Document<unknown, {}, IUserPreferences> & IUserPreferences> {
    const preferences = new UserPreferences({
      userId,
      tones: this.DEFAULT_TONES,
      audiences: this.DEFAULT_AUDIENCES,
      templates: this.DEFAULT_TEMPLATES,
      savedEmails: [],
      signatures: this.DEFAULT_SIGNATURES
    });

    return await preferences.save();
  }

  // ==================== TONES ====================
  
  async updateTones(userId: string, tones: ITone[]): Promise<IUserPreferences | null> {
    if (tones.length > 8) {
      throw new Error('Maximum 8 tones allowed');
    }

    return await UserPreferences.findOneAndUpdate(
      { userId },
      { tones },
      { new: true, upsert: true }
    );
  }

  async addTone(userId: string, tone: ITone): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.tones.length >= 8) {
      throw new Error('Maximum 8 tones allowed');
    }

    prefs.tones.push(tone);
    return await prefs.save();
  }

  async deleteTone(userId: string, toneId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.tones.length <= 1) {
      throw new Error('Minimum 1 tone required');
    }

    prefs.tones = prefs.tones.filter(t => t.id !== toneId);
    return await prefs.save();
  }

  // ==================== AUDIENCES ====================
  
  async updateAudiences(userId: string, audiences: IAudience[]): Promise<IUserPreferences | null> {
    if (audiences.length > 8) {
      throw new Error('Maximum 8 audiences allowed');
    }

    return await UserPreferences.findOneAndUpdate(
      { userId },
      { audiences },
      { new: true, upsert: true }
    );
  }

  async addAudience(userId: string, audience: IAudience): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.audiences.length >= 8) {
      throw new Error('Maximum 8 audiences allowed');
    }

    prefs.audiences.push(audience);
    return await prefs.save();
  }

  async deleteAudience(userId: string, audienceId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.audiences.length <= 1) {
      throw new Error('Minimum 1 audience required');
    }

    prefs.audiences = prefs.audiences.filter(a => a.id !== audienceId);
    return await prefs.save();
  }

  // ==================== TEMPLATES ====================
  
  async updateTemplates(userId: string, templates: ITemplate[]): Promise<IUserPreferences | null> {
    if (templates.length > 8) {
      throw new Error('Maximum 8 templates allowed');
    }

    return await UserPreferences.findOneAndUpdate(
      { userId },
      { templates },
      { new: true, upsert: true }
    );
  }

  async addTemplate(userId: string, template: ITemplate): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.templates.length >= 8) {
      throw new Error('Maximum 8 templates allowed');
    }

    prefs.templates.push({ ...template, isCustom: true });
    return await prefs.save();
  }

  async deleteTemplate(userId: string, templateId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.templates.length <= 1) {
      throw new Error('Minimum 1 template required');
    }

    prefs.templates = prefs.templates.filter(t => t.id !== templateId);
    return await prefs.save();
  }

  // ==================== SAVED EMAILS ====================
  
async saveEmail(userId: string, email: Omit<ISavedEmail, 'id' | 'timestamp'>): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    // Check if we've hit the limit of 8 saved emails
    if (prefs.savedEmails.length >= 8) {
      throw new Error('Maximum 8 saved emails allowed');
    }
    
    const newEmail: ISavedEmail = {
      ...email,
      id: `email_${Date.now()}`,
      timestamp: new Date()
    };

    prefs.savedEmails.push(newEmail);
    return await prefs.save();
  }

  async updateEmail(userId: string, emailId: string, updates: Partial<ISavedEmail>): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    const emailIndex = prefs.savedEmails.findIndex(e => e.id === emailId);
    
    if (emailIndex === -1) {
      throw new Error('Email not found');
    }

    // Update only the provided fields
    if (updates.subject !== undefined) prefs.savedEmails[emailIndex].subject = updates.subject;
    if (updates.content !== undefined) prefs.savedEmails[emailIndex].content = updates.content;
    if (updates.tone !== undefined) prefs.savedEmails[emailIndex].tone = updates.tone;
    if (updates.audience !== undefined) prefs.savedEmails[emailIndex].audience = updates.audience;
    if (updates.source !== undefined) prefs.savedEmails[emailIndex].source = updates.source;
    if (updates.isFavorite !== undefined) prefs.savedEmails[emailIndex].isFavorite = updates.isFavorite;

    return await prefs.save();
  }

  async deleteEmail(userId: string, emailId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    prefs.savedEmails = prefs.savedEmails.filter(e => e.id !== emailId);
    return await prefs.save();
  }

  async toggleEmailFavorite(userId: string, emailId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    const email = prefs.savedEmails.find(e => e.id === emailId);
    
    if (email) {
      email.isFavorite = !email.isFavorite;
      return await prefs.save();
    }

    return null;
  }

  // ==================== SIGNATURES ====================
  
  async updateSignatures(userId: string, signatures: ISignature[]): Promise<IUserPreferences | null> {
    if (signatures.length > 8) {
      throw new Error('Maximum 8 signatures allowed');
    }

    return await UserPreferences.findOneAndUpdate(
      { userId },
      { signatures },
      { new: true, upsert: true }
    );
  }

  async addSignature(userId: string, signature: ISignature): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.signatures.length >= 8) {
      throw new Error('Maximum 8 signatures allowed');
    }

    // If this signature is marked as default, unset all other defaults
    if (signature.isDefault) {
      prefs.signatures.forEach(s => s.isDefault = false);
    }

    prefs.signatures.push(signature);
    return await prefs.save();
  }

  async deleteSignature(userId: string, signatureId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    if (prefs.signatures.length <= 1) {
      throw new Error('Minimum 1 signature required');
    }

    prefs.signatures = prefs.signatures.filter(s => s.id !== signatureId);
    return await prefs.save();
  }

  async setDefaultSignature(userId: string, signatureId: string): Promise<IUserPreferences | null> {
    const prefs = await this.getUserPreferences(userId);
    
    // Unset all defaults
    prefs.signatures.forEach(s => s.isDefault = false);
    
    // Set the new default
    const signature = prefs.signatures.find(s => s.id === signatureId);
    if (signature) {
      signature.isDefault = true;
      return await prefs.save();
    }

    return null;
  }

  async resetToDefaults(userId: string): Promise<IUserPreferences | null> {
    return await UserPreferences.findOneAndUpdate(
      { userId },
      {
        tones: this.DEFAULT_TONES,
        audiences: this.DEFAULT_AUDIENCES,
        templates: this.DEFAULT_TEMPLATES,
        savedEmails: [],
        signatures: this.DEFAULT_SIGNATURES
      },
      { new: true, upsert: true }
    );
  }
}

export default new UserPreferencesService();