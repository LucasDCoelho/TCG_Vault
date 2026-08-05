import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginPage } from './pages/login/login';
import { AuthCallbackPage } from './pages/auth-callback/auth-callback';
import { VaultPage } from './pages/vault/vault';
import { ScanPage } from './pages/scan/scan';
import { CardDetailPage } from './pages/card-detail/card-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'vault', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'auth/callback', component: AuthCallbackPage },
  { path: 'vault', component: VaultPage, canActivate: [authGuard] },
  { path: 'scan', component: ScanPage, canActivate: [authGuard] },
  { path: 'cards/:id', component: CardDetailPage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'vault' },
];
