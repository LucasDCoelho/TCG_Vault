# DESIGN — Identidade Visual RabbitLab · TCG Vault

> Fonte de verdade visual do produto. Aplicar em qualquer UI do projeto.
> Decisão de marca: **simples e moderna, com tons de laranja e branco.**

## 1. Direção de marca

| Atributo | Valor |
|----------|-------|
| Personalidade | Curiosa, colecionadora, confiável, jovem |
| Adjetivos | Simples, moderno, quente, acolhedor |
| Sensação | Guardar algo precioso — o cofre do colecionador |
| Público | Colecionadores de TCG (Mágic, Pokémon, Yu-Gi-Oh etc.) |
| Estilo base | Minimalismo moderno (tool recomendou `Minimalism`) |
| Anti-padrões | Emoji como ícone, cores cruas no componente, layout bagunçado |

## 2. Paleta — Laranja + Branco

Laranja é o primary (calor, energia do coelho/colecionador). Branco é o canvas.
Cinzas neutros dão hierarquia. Azul fica reservado apenas para links/erros não.

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#F97316` | CTA, destaque, brand |
| `--color-primary-strong` | `#EA580C` | Hover/ativo de CTA |
| `--color-primary-soft` | `#FFEDD5` | Fundo de chips/badges suaves |
| `--color-accent` | `#FB923C` | Elementos secundários de marca |
| `--color-background` | `#FFFFFF` | Fundo principal (branco) |
| `--color-surface` | `#FFF7ED` | Cartões/cofres — branco quente |
| `--color-surface-alt` | `#FAFAF9` | Áreas alternadas |
| `--color-foreground` | `#1C1917` | Texto principal (quase preto, tom quente) |
| `--color-foreground-muted` | `#57534E` | Texto secundário |
| `--color-border` | `#E7E5E4` | Bordas e divisores |
| `--color-success` | `#16A34A` | Confirmações |
| `--color-error` | `#DC2626` | Erros/destrutivo |
| `--color-warning` | `#D97706` | Avisos |

**Acessibilidade:** texto sobre branco usa `#1C1917` (contraste ~17:1).
CTA laranja `#F97316` com texto branco tem contraste ~3.1:1 — para textos em
botão pequeno, usar a variante `#C2410C` (contraste ~4.6:1). Regra: botão
primário pequeno usa texto branco sobre `#EA580C`.

## 3. Tipografia

| Papel | Fonte | Peso |
|-------|-------|------|
| Headings | Inter (600–800) | SemiBold → ExtraBold |
| Body | Inter (400) | Regular |
| Labels/botões | Inter (500–600) | Medium → SemiBold |

- Escala: 12 / 14 / 16 / 18 / 24 / 32 / 40
- Body mínimo 16px; line-height 1.5–1.75
- Títulos em bold para hierarquia; nunca usar itálico em UI

## 4. Espaçamento, raio e sombras

- Escala de espaçamento: 4 / 8 / 12 / 16 / 24 / 32 / 48
- Raio: cartões 12px; botões 8px; chips 999px
- Sombras: sutis, quentes — `0 1px 3px rgba(28,25,23,.08)`, elevado `0 8px 24px rgba(249,115,22,.12)`
- Borda: 1px `#E7E5E4` para separar superfícies

## 5. Componentes (resumo)

| Componente | Regra |
|------------|-------|
| Botão primário | Fundo `#F97316`, hover `#EA580C`, texto branco, raio 8px, altura ≥44px |
| Botão secundário | Fundo `--color-surface-alt`, borda 1px, texto `--color-foreground` |
| Cartão de carta | Superfície branca, borda suave, raio 12px, sombra sutil; imagem proporção carta 63:88 (Magic) |
| Chips (raridade) | Fundo `--color-primary-soft`, texto `#C2410C`, raio 999px |
| Input | Borda 1px, foco com anel laranja 2px + `outline` visível |
| Nav | Topbar branca com borda inferior, logo + avatar |
| Empty state | Ícone SVG + mensagem + CTA ("Escaneie sua primeira carta") |

## 6. Ícones e assets

- Ícones: SVG (Lucide/Heroicons), stroke consistente 2px. Sem emoji.
- Logo RabbitLab: coelho estilizado simples (silhueta geométrica) em laranja
  `#F97316`; versão mono em `#1C1917`. Implementação inicial: SVG inline.
- Imagens de cartas: sempre a foto oficial fornecida pela base de cartas
  (Scryfall); fallback placeholder com coelho em traço.

## 7. Motion

- Micro-interações 150–300ms, easing suave (cubic-bezier)
- Hover de cartão: `transform: translateY(-2px)` + sombra elevada
- Respeitar `prefers-reduced-motion`
- Feedback de loading: skeleton ou spinner; nunca bloquear tela sem indicação

## 8. Aplicação por tela

| Tela | Regras |
|------|--------|
| Login | Centrado em branco, logo grande, botão "Entrar com Google" |
| Cofre | Grid responsivo de cartões (1/2/4 colunas), topbar fixa |
| Scan | Área de upload grande com drop zone, spinner de OCR, candidatos em lista |
| Detalhe | Foto à esquerda, dados à direita (mobile: empilhado) |

## 9. Tokens de implementação

- **Front (Angular):** aplicar como CSS custom properties globais em
  `styles.scss` + tema do Angular Material (se usado) mapeado para os mesmos
  tokens.
- **Back:** não usa tokens (API pura).
