import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Tone, Audience, Template, Signature } from '../models/email.model';
import { environment } from '../../environments/environment';

export interface SavedEmail {
  id: string;
  subject: string;
  content: string;
  tone: string;
  audience: string;
  timestamp: Date;
  source: 'ai' | 'manual';
  isFavorite?: boolean;
}

export interface UserPreferences {
  userId: string;
  tones: Tone[];
  audiences: Audience[];
  templates: Template[];
  savedEmails: SavedEmail[];
  signatures: Signature[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})

export class PreferencesService {
  private apiUrl = environment.apiUrl;
  
  // Observables for reactive data
  private tonesSubject = new BehaviorSubject<Tone[]>([]);
  private audiencesSubject = new BehaviorSubject<Audience[]>([]);
  private templatesSubject = new BehaviorSubject<Template[]>([]);
  private savedEmailsSubject = new BehaviorSubject<SavedEmail[]>([]);
  private signaturesSubject = new BehaviorSubject<Signature[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public tones$ = this.tonesSubject.asObservable();
  public audiences$ = this.audiencesSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();
  public savedEmails$ = this.savedEmailsSubject.asObservable();
  public signatures$ = this.signaturesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== LOAD USER PREFERENCES ====================
  
  async loadUserPreferences(token: string): Promise<boolean> {
    this.loadingSubject.next(true);
    
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences`,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.tonesSubject.next(response.data.tones);
        this.audiencesSubject.next(response.data.audiences);
        this.templatesSubject.next(response.data.templates);
        this.savedEmailsSubject.next(response.data.savedEmails);
        this.signaturesSubject.next(response.data.signatures || []);
        this.loadingSubject.next(false);
        return true;
      }

      this.loadingSubject.next(false);
      return false;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      this.loadingSubject.next(false);
      return false;
    }
  }

  // ==================== GETTERS ====================
  
  getTones(): Tone[] {
    return this.tonesSubject.value;
  }

  getAudiences(): Audience[] {
    return this.audiencesSubject.value;
  }

  getTemplates(): Template[] {
    return this.templatesSubject.value;
  }

  getSavedEmails(): SavedEmail[] {
    return this.savedEmailsSubject.value;
  }

  getSignatures(): Signature[] {
    return this.signaturesSubject.value;
  }

  getDefaultSignature(): Signature | undefined {
    return this.signaturesSubject.value.find(s => s.isDefault);
  }

  // ==================== TONES ====================
  
  async updateTones(token: string, tones: Tone[]): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/tones`,
          { tones },
          { headers }
        )
      );

      if (response.success && response.data) {
        this.tonesSubject.next(response.data.tones);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update tones:', error);
      return false;
    }
  }

  async addTone(token: string, tone: Tone): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/tones`,
          tone,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.tonesSubject.next(response.data.tones);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add tone:', error);
      return false;
    }
  }

  async deleteTone(token: string, toneId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/tones/${toneId}`,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.tonesSubject.next(response.data.tones);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete tone:', error);
      return false;
    }
  }

  // ==================== AUDIENCES ====================
  
  async updateAudiences(token: string, audiences: Audience[]): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/audiences`,
          { audiences },
          { headers }
        )
      );

      if (response.success && response.data) {
        this.audiencesSubject.next(response.data.audiences);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update audiences:', error);
      return false;
    }
  }

  async addAudience(token: string, audience: Audience): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/audiences`,
          audience,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.audiencesSubject.next(response.data.audiences);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add audience:', error);
      return false;
    }
  }

  async deleteAudience(token: string, audienceId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/audiences/${audienceId}`,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.audiencesSubject.next(response.data.audiences);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete audience:', error);
      return false;
    }
  }

  // ==================== TEMPLATES ====================
  
  async updateTemplates(token: string, templates: Template[]): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/templates`,
          { templates },
          { headers }
        )
      );

      if (response.success && response.data) {
        this.templatesSubject.next(response.data.templates);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update templates:', error);
      return false;
    }
  }

  async addTemplate(token: string, template: Template): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/templates`,
          template,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.templatesSubject.next(response.data.templates);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add template:', error);
      return false;
    }
  }

  async deleteTemplate(token: string, templateId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/templates/${templateId}`,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.templatesSubject.next(response.data.templates);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }

  // ==================== SAVED EMAILS ====================
  
  async saveEmail(token: string, email: Omit<SavedEmail, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/emails`,
          email,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.savedEmailsSubject.next(response.data.savedEmails);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save email:', error);
      return false;
    }
  }

  async updateEmail(token: string, emailId: string, updatedEmail: Partial<SavedEmail>): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/emails/${emailId}`,
          updatedEmail,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.savedEmailsSubject.next(response.data.savedEmails);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update email:', error);
      return false;
    }
  }

  async deleteEmail(token: string, emailId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/emails/${emailId}`,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.savedEmailsSubject.next(response.data.savedEmails);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete email:', error);
      return false;
    }
  }

  async toggleEmailFavorite(token: string, emailId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.patch<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/emails/${emailId}/favorite`,
          {},
          { headers }
        )
      );

      if (response.success && response.data) {
        this.savedEmailsSubject.next(response.data.savedEmails);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle email favorite:', error);
      return false;
    }
  }

  // ==================== SIGNATURES ====================
  
  async updateSignatures(token: string, signatures: Signature[]): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/signatures`,
          { signatures },
          { headers }
        )
      );

      if (response.success && response.data) {
        this.signaturesSubject.next(response.data.signatures);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update signatures:', error);
      return false;
    }
  }

  async addSignature(token: string, signature: Signature): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/signatures`,
          signature,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.signaturesSubject.next(response.data.signatures);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add signature:', error);
      return false;
    }
  }

  async deleteSignature(token: string, signatureId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/signatures/${signatureId}`,
          { headers }
        )
      );

      if (response.success && response.data) {
        this.signaturesSubject.next(response.data.signatures);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete signature:', error);
      return false;
    }
  }

  async setDefaultSignature(token: string, signatureId: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.patch<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/signatures/${signatureId}/default`,
          {},
          { headers }
        )
      );

      if (response.success && response.data) {
        this.signaturesSubject.next(response.data.signatures);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set default signature:', error);
      return false;
    }
  }

  // ==================== RESET ====================
  
  async resetToDefaults(token: string): Promise<boolean> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: UserPreferences }>(
          `${this.apiUrl}/preferences/reset`,
          {},
          { headers }
        )
      );

      if (response.success && response.data) {
        this.tonesSubject.next(response.data.tones);
        this.audiencesSubject.next(response.data.audiences);
        this.templatesSubject.next(response.data.templates);
        this.savedEmailsSubject.next(response.data.savedEmails);
        this.signaturesSubject.next(response.data.signatures || []);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      return false;
    }
  }
}