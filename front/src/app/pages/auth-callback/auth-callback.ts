import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `<div class="loading-block"><span class="spinner"></span><span>Autenticando…</span></div>`,
  styles: [':host { display: block; padding: 48px 0; }'],
})
export class AuthCallbackPage implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.establishSession(token);
      this.authService.loadUser();
    }
    this.router.navigate(['/vault']);
  }
}
