import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { lastValueFrom } from 'rxjs';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  licenseClass: string;
  iRating: number;
}

interface LoginResponse {
  token: string;
  displayName: string;
  licenseClass: string;
  iRating: number;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<UserProfile | null>(null);
  token = signal<string | null>(null);

  constructor() {
    this.loadToken();
  }

  /** Verifies the stored token with the server. Call before guarded navigation. */
  async verifyToken(): Promise<boolean> {
    if (this.currentUser()) return true;
    if (!this.token()) return false;
    try {
      const res = await lastValueFrom(
        this.http.get<UserProfile>(`${API_BASE}/auth/me`)
      );
      this.currentUser.set(res);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  async login(username: string, password: string): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<LoginResponse>(`${API_BASE}/auth/login`, { username, password })
    );
    this.token.set(res.token);
    localStorage.setItem('rs_token', res.token);
    this.currentUser.set({
      id: res.userId,
      username: res.displayName,
      displayName: res.displayName,
      licenseClass: res.licenseClass,
      iRating: res.iRating,
    });
  }

  logout() {
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem('rs_token');
  }

  private loadToken() {
    const saved = localStorage.getItem('rs_token');
    if (saved) {
      this.token.set(saved);
    }
  }
}
