import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/api';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage implements OnInit {
  protected loading = true;
  protected loginUrl: string | null = null;
  protected devWarning: string | null = null;
  protected error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/vault']);
      return;
    }
    this.authService.login().subscribe({
      next: (resp: LoginResponse) => this.handle(resp),
      error: () => {
        this.loading = false;
        this.error = 'Não foi possível conectar ao servidor.';
      },
    });
  }

  private handle(resp: LoginResponse): void {
    this.loading = false;
    if (resp.mode === 'dev' && resp.token) {
      this.authService.establishSession(resp.token, resp.user);
      this.router.navigate(['/vault']);
      return;
    }
    if (resp.url) {
      this.loginUrl = resp.url;
    }
  }

  loginWithGoogle(): void {
    if (this.loginUrl) window.location.href = this.loginUrl;
  }
}
