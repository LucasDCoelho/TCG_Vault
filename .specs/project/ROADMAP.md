# ROADMAP — TCG Vault

## MVP (concluído 2026-08-05)

- [x] Bootstrap .specs
- [x] Identidade visual laranja/branco (DESIGN.md)
- [x] Back: auth Google OAuth + JWT (modo dev sem credenciais)
- [x] Back: scan de carta via OCR + match na base de cartas (Scryfall)
- [x] Back: CRUD do cofre
- [x] Front: login, cofre, scan, detalhe
- [x] Integração e verificação (build + testes + fluxo real com upload)
- [x] Cartas PT: nome/tipo/descrição localizados
- [x] Deploy: front Vercel + back Render + Postgres, OAuth Google em produção
- [x] MVP **no ar** (login Google ponta a ponta funcionando) — 2026-08-05

## Pós-MVP (backlog)

- Segurança pré-divulgação: JWT em HttpOnly cookie
- Suporte a outros TCGs além de MTG (bases PokéAPI, YuGiOh DB, One Piece)
- Busca avançada e filtros no cofre (raridade, coleção, valor)
- Cofres múltiplos (pastas/coleções nomeadas)
- Preço e valorização de cartas (TCGPlayer/Ebay feed)
- App mobile / PWA offline
- Compartilhamento de cofre público
