# Feature: TCG Vault — Cofre de Cartas

## Contexto

Projeto novo (greenfield) da RabbitLab. Site para colecionador fotografar uma
carta de TCG e guardá-la organizada no próprio cofre digital, com o mínimo de
digitação manual.

## Problema real

Registrar carta manualmente é tedioso e propenso a erro. O objetivo é: foto →
carta reconhecida → item no cofre com metadados corretos.

## Requisitos

| ID | Requisito | Prioridade | Notas |
|----|-----------|------------|-------|
| R01 | Login via Google OAuth2 | Must | Fluxo authorization-code + callback; JWT emitido pelo back |
| R02 | Sessão autenticada protegida por JWT Bearer | Must | `/me` protegido; demais endpoints exigem token |
| R03 | Escanear carta: upload de imagem → OCR → sugerir match de carta | Must | OCR pluggável (Google Vision; fallback Tesseract local). Match via Scryfall (MTG no MVP) |
| R04 | Confirmar carta escaneada e salvar no cofre | Must | Persistir dados + foto enviada |
| R05 | Listar cartas do cofre | Must | Ordenar por data de adição, mais recente primeiro |
| R06 | Ver detalhe da carta | Should | Foto, nome, coleção, raridade, nº, preço (se Scryfall prover) |
| R07 | Remover carta do cofre | Should | Confirmação antes de apagar |
| R08 | Front Angular consumindo a API via HTTP | Must | Tokens de design laranja/branco aplicados |
| R09 | Modo dev sem credenciais externas | Must | Sem `GOOGLE_*`/`VISION_*`, o back roda com mock/fallback e aviso claro |
| R10 | Banco SQLite com schema versionado | Must | Migração simples via SQLAlchemy create_all |

## Fora do escopo (MVP)

- TCGs além de MTG
- Cofres múltiplos / pastas
- Valorização de preço, trading, marketplace
- App mobile nativo / PWA offline
- Recuperação de senha (login é social)

## Critérios de aceite

- [ ] R01: com credenciais configuradas, usuário faz login pelo Google e recebe JWT. Sem credenciais, modo dev responde com usuário mock (aviso visível).
- [ ] R03: enviando imagem de uma carta, o back retorna 1+ candidatos com nome/coleção/raridade. Sem OCR configurado, permite entrada manual.
- [ ] R04: confirmado, carta aparece no cofre com foto persistida.
- [ ] R05/R06/R07: listar, ver e remover funcionam com token válido; token inválido → 401.
- [ ] R08: `ng build` sem erros; rotas funcionais (login, cofre, scan).
- [ ] R09: `uvicorn` sobe sem credenciais e endpoints dev respondem.
- [ ] R10: banco recriável (`create_all`) e dados sobrevivem restart.

## Dependências

- Google OAuth2 (credenciais opcionais no dev)
- Google Cloud Vision ou Tesseract (OCR)
- Scryfall API (base de cartas MTG)

## Riscos identificados

- OCR de baixa qualidade em cartas com tipografia estilizada → aceitar match imperfeito e permitir correção manual.
- Scryfall limita taxa de requisições (~10 req/s, ~10k req/mês bulk) → cache simples em memória no back.
- Google OAuth indisponível sem credenciais → modo dev mock.
- Imagem grande → limitar upload a ~10MB e redimensionar no front antes de enviar.
