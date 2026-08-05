import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { apiUrl, fullUrl } from '../../services/api';
import { Card } from '../../models/api';

@Component({
  selector: 'app-card-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './card-detail.html',
  styleUrl: './card-detail.scss',
})
export class CardDetailPage implements OnInit {
  protected card: Card | null = null;
  protected loading = true;
  protected error: string | null = null;
  protected fullUrl = fullUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<Card>(apiUrl(`/cards/${id}`)).subscribe({
      next: (card) => {
        this.card = card;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Carta não encontrada.';
      },
    });
  }
}
