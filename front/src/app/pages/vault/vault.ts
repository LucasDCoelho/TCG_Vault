import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { apiUrl, fullUrl } from '../../services/api';
import { Card } from '../../models/api';

@Component({
  selector: 'app-vault',
  imports: [RouterLink],
  templateUrl: './vault.html',
  styleUrl: './vault.scss',
})
export class VaultPage implements OnInit {
  protected cards: Card[] = [];
  protected loading = true;
  protected error: string | null = null;
  protected toast: string | null = null;
  protected fullUrl = fullUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.http.get<Card[]>(apiUrl('/cards')).subscribe({
      next: (cards) => {
        this.cards = cards;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Não foi possível carregar seu cofre.';
      },
    });
  }

  remove(card: Card): void {
    const ok = window.confirm(`Remover "${card.name}" do cofre?`);
    if (!ok) return;
    this.http.delete(apiUrl(`/cards/${card.id}`)).subscribe({
      next: () => {
        this.cards = this.cards.filter((c) => c.id !== card.id);
        this.showToast('Carta removida do cofre.');
      },
      error: () => this.showToast('Erro ao remover a carta.'),
    });
  }

  private showToast(message: string): void {
    this.toast = message;
    setTimeout(() => (this.toast = null), 3000);
  }
}
