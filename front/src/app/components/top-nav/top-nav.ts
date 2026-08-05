import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { fullUrl } from '../../services/api';

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.scss',
})
export class TopNavComponent {
  constructor(
    protected authService: AuthService,
    private router: Router,
  ) {}

  protected fullUrl = fullUrl;

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
    });
  }
}
