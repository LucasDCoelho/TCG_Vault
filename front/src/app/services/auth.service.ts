import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { apiUrl } from './api';
import { LoginResponse, User } from '../models/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSig = signal<User | null>(null);

  readonly user = this.userSig.asReadonly();

  constructor(private http: HttpClient) {}

  login(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(apiUrl('/auth/login'));
  }

  me(): Observable<User> {
    return this.http.get<User>(apiUrl('/auth/me'));
  }

  loadUser(): void {
    this.me().subscribe({
      next: (u) => this.userSig.set(u),
      error: () => this.userSig.set(null),
    });
  }

  checkSession(): Observable<boolean> {
    if (this.userSig()) return of(true);
    return this.me().pipe(
      map((u) => {
        this.userSig.set(u);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  isAuthenticated(): boolean {
    return !!this.userSig();
  }

  logout(): Observable<unknown> {
    return this.http.post(apiUrl('/auth/logout'), {}).pipe(
      tap(() => this.userSig.set(null)),
      catchError(() => of(false)),
    );
  }
}
