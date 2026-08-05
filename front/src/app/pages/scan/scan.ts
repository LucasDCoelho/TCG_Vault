import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { apiUrl, fullUrl } from '../../services/api';
import { ScanResponse, ScryfallCard } from '../../models/api';

@Component({
  selector: 'app-scan',
  imports: [FormsModule],
  templateUrl: './scan.html',
  styleUrl: './scan.scss',
})
export class ScanPage {
  protected file: File | null = null;
  protected previewUrl: string | null = null;
  protected scanning = false;
  protected saving = false;
  protected error: string | null = null;
  protected result: ScanResponse | null = null;
  protected query = '';
  protected searching = false;
  protected searchResults: ScryfallCard[] = [];
  protected selected: ScryfallCard | null = null;
  protected manual = false;
  protected fullUrl = fullUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) this.setFile(f);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const f = event.dataTransfer?.files?.[0];
    if (f) this.setFile(f);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setFile(f: File): void {
    if (!f.type.startsWith('image/')) {
      this.error = 'Envie uma imagem (JPEG/PNG/WebP).';
      return;
    }
    this.file = f;
    this.error = null;
    this.result = null;
    this.selected = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(f);
  }

  scan(): void {
    if (!this.file || this.scanning) return;
    this.scanning = true;
    this.error = null;
    const form = new FormData();
    form.append('file', this.file);
    this.http.post<ScanResponse>(apiUrl('/scan'), form).subscribe({
      next: (resp) => {
        this.result = resp;
        this.scanning = false;
        this.manual = resp.candidates.length === 0;
      },
      error: () => {
        this.scanning = false;
        this.error = 'Falha ao escanear. Tente novamente.';
      },
    });
  }

  search(): void {
    const q = this.query.trim();
    if (!q || this.searching) return;
    this.searching = true;
    this.error = null;
    this.http.get<ScryfallCard[]>(apiUrl('/scan/search'), { params: { q } }).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.searching = false;
        if (this.result) this.result.candidates = results;
        if (results.length === 0) this.error = 'Nenhuma carta encontrada para essa busca.';
      },
      error: () => {
        this.searching = false;
        this.error = 'Falha na busca. Tente novamente.';
      },
    });
  }

  select(candidate: ScryfallCard): void {
    this.selected = candidate;
  }

  confirm(): void {
    const card = this.selected;
    if (!card || this.saving) return;
    this.saving = true;
    this.error = null;

    const form = new FormData();
    form.append('name', card.name);
    form.append('printed_name', card.printed_name ?? '');
    form.append('printed_type_line', card.printed_type_line ?? '');
    form.append('description', card.description ?? '');
    form.append('set_name', card.set_name);
    form.append('set_code', card.set_code);
    form.append('collector_number', card.collector_number);
    form.append('rarity', card.rarity);
    form.append('image_uri', card.image_uri);
    form.append('scryfall_uri', card.scryfall_uri);
    if (card.price_usd != null) form.append('price_usd', String(card.price_usd));
    if (this.file) form.append('photo', this.file);

    this.http.post(apiUrl('/cards'), form).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/vault']);
      },
      error: () => {
        this.saving = false;
        this.error = 'Falha ao guardar a carta no cofre.';
      },
    });
  }

  reset(): void {
    this.file = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.result = null;
    this.selected = null;
    this.searchResults = [];
    this.query = '';
    this.error = null;
    this.manual = false;
  }
}
