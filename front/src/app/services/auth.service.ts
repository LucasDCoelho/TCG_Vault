import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { apiUrl } from './api';
import { TOKEN_KEY } from './auth.interceptor';
import { LoginResponse, User } from '../models/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSig = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private userSig = signal<User | null>(null);

  readonly token = this.tokenSig.asReadonly();
  readonly user = this.userSig.asReadonly();

  constructor(private http: HttpClient) {}

  login(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(apiUrl('/auth/login'));
  }

  me(): Observable<User> {
    return this.http.get<User>(apiUrl('/auth/me'));
  }

  establishSession(token: string, user?: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSig.set(token);
    if (user) this.userSig.set(user);
  }

  loadUser(): void {
    if (!this.tokenSig()) return;
    this.me().subscribe({
      next: (u) => this.userSig.set(u),
      error: () => this.logout(),
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokenSig();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSig.set(null);
    this.userSig.set(null);
  }
}
