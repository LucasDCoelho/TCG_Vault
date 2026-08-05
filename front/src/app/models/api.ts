export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
}

export interface LoginResponse {
  mode: 'google' | 'dev';
  url?: string;
  token?: string;
  user?: User;
  dev_warning?: string;
}

export interface ScryfallCard {
  name: string;
  printed_name?: string;
  printed_type_line?: string;
  description?: string;
  set_name: string;
  set_code: string;
  collector_number: string;
  rarity: string;
  image_uri: string;
  scryfall_uri: string;
  price_usd: number | null;
}

export interface ScanResponse {
  scan_id: string;
  ocr_provider: string;
  recognized_text: string;
  candidates: ScryfallCard[];
  message: string;
}

export interface Card extends ScryfallCard {
  id: number;
  photo_url: string;
  created_at: string;
}
