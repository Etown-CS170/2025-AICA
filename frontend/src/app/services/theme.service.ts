import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'aica-theme';
  private themeSubject: BehaviorSubject<Theme>;
  public theme$: Observable<Theme>;

  constructor() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = this.getSavedTheme();
    this.themeSubject = new BehaviorSubject<Theme>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();
    
    // Apply the initial theme
    this.applyTheme(savedTheme);
  }

  /**
   * Get the current theme
   */
  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme: Theme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set a specific theme
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Apply theme to the document
   */
  private applyTheme(theme: Theme): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  /**
   * Get saved theme from localStorage or system preference
   */
  private getSavedTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (error) {
      console.error('Failed to retrieve theme preference:', error);
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }
}