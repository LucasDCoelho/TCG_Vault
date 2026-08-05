# CONCERNS

| Área | Risco | Severidade |
|------|-------|------------|
| Auth | JWT em localStorage no front — vulnerável a XSS | Média (aceitável no MVP; migrar para HttpOnly cookie no pós-MVP) |
| OCR | Qualidade do OCR em tipografia estilizada de cartas pode gerar match errado | Média (mitigado: lista de candidatos + correção manual) |
| Scryfall | Rate limit e disponibilidade externa | Média (cache TTL mitiga; fallback = busca manual) |
| Banco | SQLite sem migrations (Alembic) — schema muda manualmente | Baixa (MVP) |
| Uploads | Arquivos em disco local, sem hash/scan de conteúdo | Baixa (MVP, aceita só imagens) |
| Segurança | `JWT_SECRET` default em dev; precisa troca obrigatória em produção | Alta (só vale se deployar sem mudar) |
| Dependência externa | Google OAuth e Vision exigem conta e credenciais reais para produção | Alta para prod, inexistente para dev (modo mock) |
