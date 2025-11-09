import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EmailRequest, Tone, Audience, Template } from '../models/email.model';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generate email using backend API
   * @param request EmailRequest object
   * @param token Optional JWT token for authorization
   */
  async generateEmail(request: EmailRequest, token?: string): Promise<any> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return firstValueFrom(
      this.http.post(`${this.apiUrl}/email/generate`, request, { headers })
    );
  }

  /**
   * Get available tones
   */
  getTones(): Observable<Tone[]> {
    return this.http.get<{ success: boolean; tones: Tone[] }>(`${this.apiUrl}/email/tones`)
      .pipe(
        map(response => response.tones),
        catchError(() => of(this.getDefaultTones()))
      );
  }

  /**
   * Get available audiences
   */
  getAudiences(): Observable<Audience[]> {
    return this.http.get<{ success: boolean; audiences: Audience[] }>(`${this.apiUrl}/email/audiences`)
      .pipe(
        map(response => response.audiences),
        catchError(() => of(this.getDefaultAudiences()))
      );
  }

  /**
   * Get email templates
   */
  getTemplates(): Observable<Template[]> {
    return this.http.get<{ success: boolean; templates: Template[] }>(`${this.apiUrl}/email/templates`)
      .pipe(
        map(response => response.templates),
        catchError(() => of(this.getDefaultTemplates()))
      );
  }

  /**
   * Check API health
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl.replace('/api', '')}/api/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('EmailService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Default tones if API fails
   */
  private getDefaultTones(): Tone[] {
    return [
      { id: 'professional', label: 'Professional', color: 'bg-blue-500', description: 'Clear and direct' },
      { id: 'friendly', label: 'Friendly', color: 'bg-green-500', description: 'Warm and approachable' },
      { id: 'formal', label: 'Formal', color: 'bg-purple-500', description: 'Respectful and structured' },
      { id: 'persuasive', label: 'Persuasive', color: 'bg-orange-500', description: 'Compelling and action-oriented' }
    ];
  }

  /**
   * Default audiences if API fails
   */
  private getDefaultAudiences(): Audience[] {
    return [
      { id: 'professor', label: 'Professor', icon: 'graduation-cap' },
      { id: 'student', label: 'Student', icon: 'user' },
      { id: 'coach', label: 'Coach/Trainer', icon: 'users' },
      { id: 'professional', label: 'Professional', icon: 'briefcase' }
    ];
  }

  /**
   * Default templates if API fails
   */
  private getDefaultTemplates(): Template[] {
    return [
      { id: 'thank-you', name: 'Thank You Email', prompt: 'Write a thank you email' },
      { id: 'meeting-request', name: 'Meeting Request', prompt: 'Request a meeting to discuss' },
      { id: 'follow-up', name: 'Follow Up', prompt: 'Write a follow-up email' },
      { id: 'introduction', name: 'Introduction', prompt: 'Write an introduction email' }
    ];
  }
}
