import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `<div class="loading-block"><span class="spinner"></span><span>Autenticando…</span></div>`,
  styles: [':host { display: block; padding: 48px 0; }'],
})
export class AuthCallbackPage implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.checkSession().subscribe({
      next: (ok) => this.router.navigate(ok ? ['/vault'] : ['/login']),
    });
  }
}
