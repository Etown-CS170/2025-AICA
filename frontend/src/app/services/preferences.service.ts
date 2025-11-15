import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Tone, Audience, Template } from '../models/email.model';
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
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public tones$ = this.tonesSubject.asObservable();
  public audiences$ = this.audiencesSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();
  public savedEmails$ = this.savedEmailsSubject.asObservable();
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      return false;
    }
  }
}