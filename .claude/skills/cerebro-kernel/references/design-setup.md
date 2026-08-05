# Design — Setup e Comandos (ui-ux-pro-max integrado)

Capacidade de design embutida diretamente no cerebro-kernel via ui-ux-pro-max. Busca inteligente, design system generator, brand identity, logos, CIP, slides, banners, icons. Não depende de nenhuma skill externa.

---

## Regra de desambiguação — "design" arquitetural vs. "design" de interface

O kernel usa "design" para arquitetura (`references/design.md`, `design.md` de feature). Este arquivo usa "design" para UI. Resolver por contexto:

| Sinal no pedido | Sentido | Rotear para |
|---|---|---|
| "essa tela parece IA", "polir esse dashboard", "craft uma landing page", menção a cor/tipografia/componente/layout | UI de interface | Este arquivo |
| "desenhar a arquitetura do módulo de pagamentos", "design da API de eventos", menção a dado/módulo/integração/backend | Arquitetural | `references/design.md` |
| "vamos falar sobre o design disso" (sem mais contexto) | Ambíguo | Perguntar uma vez: "design de interface (UI) ou design de arquitetura (backend/dados)?" |

Nunca supor o sentido quando o pedido usa só a palavra "design" isolada sem pistas de superfície (tela/componente/cor) ou de sistema (módulo/API/dado).

## Auto-sizing de UI

| Escopo | Exemplo | Ação |
|---|---|---|
| **Pontual** | "muda a cor desse botão", "ajusta o espaçamento dessa seção" | Rotear direto — busca pontual no `--domain` correspondente |
| **Sistêmico** | "bora repensar o design system", rebrand, nova arquitetura de componentes | `--design-system` completo antes de aplicar |

---

## Setup

Você DEVE fazer estes passos antes de prosseguir com qualquer comando de design:

1. **Verificar Python disponível:**
   ```bash
   python3 --version || python --version
   ```
   Se não estiver instalado, perguntar ao operador. No Windows, usar `python` em vez de `python3`.

2. **Carregar o reference principal:** `references/design/SKILL-UI-UX.md` — Quick Reference §1–§10 e workflow completo.

3. **Identificar o domínio do pedido:** mapear o que o usuário pediu para uma das 10 categorias:
   - §1 Accessibility (CRITICAL)
   - §2 Touch & Interaction (CRITICAL)
   - §3 Performance (HIGH)
   - §4 Style Selection (HIGH)
   - §5 Layout & Responsive (HIGH)
   - §6 Typography & Color (MEDIUM)
   - §7 Animation (MEDIUM)
   - §8 Forms & Feedback (MEDIUM)
   - §9 Navigation Patterns (HIGH)
   - §10 Charts & Data (LOW)

4. **Executar busca correspondente:**
   ```bash
   python3 .claude/skills/cerebro-kernel/scripts/design/ui-ux/search.py "<query>" --design-system -p "ProjectName"
   ```
   ou para busca pontual:
   ```bash
   python3 .claude/skills/cerebro-kernel/scripts/design/ui-ux/search.py "<keyword>" --domain <domain>
   ```

5. **Carregar sub-skill adicional se necessário:** brand, tokens, logo, slides, banner, icon, CIP — conforme tabela de comandos em `SKILL.md`.

---

## Diretrizes de design

Produza código pronto pra shipar, nível de produção, não protótipo ou ponto de partida. Não tome atalhos a menos que o usuário peça (na dúvida, pergunte). Não pare antes de chegar numa implementação completa (bonita, responsiva, rápida, precisa, sem bugs, on brand).

### Regras gerais

#### Acessibilidade
- Contraste ≥4.5:1 para texto normal (WCAG AA), ≥3:1 para texto grande
- Alt text descritivo para imagens significativas
- Focus rings visíveis em todos os elementos interativos
- Keyboard navigation funcional em todas as pages

#### Tipografia
- Limite a linha de corpo a 65–75ch
- Line-height 1.5–1.75 para texto de corpo
- Base 16px (evita auto-zoom no iOS)
- Use `text-wrap: balance` em h1–h3

#### Layout
- Mobile-first breakpoints: 375 / 768 / 1024 / 1440
- Espaçamento em sistema 4pt/8dp
- Flexbox pra 1D, Grid pra 2D
- Sem scroll horizontal em mobile

#### Motion
- Duração 150–300ms para micro-interações
- Use transform/opacity, nunca width/height/top/left
- Sempre respeitar `prefers-reduced-motion`
- Ease-out para entrada, ease-in para saída

#### Touch
- Alvos de toque ≥44×44pt (iOS) / ≥48×48dp (Android)
- Espaçamento ≥8px entre alvos de toque
- Nunca depender apenas de hover

### Proibições absolutas

- **Texto cinza sobre fundo colorido** → usar cor do matiz do fundo
- **Cards aninhados** → sempre errado
- **Valores arbitrários de z-index** (999, 9999) → usar escala semântica
- **Emojis como ícones estruturais** → usar SVG (Phosphor, Heroicons)
- **Bounce/elastic em animações** → usar ease-out-quart/quint/expo

---

## Comandos (lookup rápido)

| Comando | Categoria | Descrição |
|---|---|---|
| `design system` | Generate | Gera design system completo com `--design-system` |
| `brand` | Identity | Brand identity, voz, guidelines |
| `logo` | Generate | 55+ estilos, Gemini AI |
| `banner` | Generate | 22 estilos multi-formato |
| `slides` | Generate | Apresentações HTML com Chart.js |
| `icon` | Generate | 15 estilos SVG |
| `tokens` | Architecture | Arquitetura Primitive → Semantic → Component |
| `ui-styling` | Implement | shadcn/ui + Tailwind CSS |
| `critique` | Evaluate | Review de UX com Quick Reference |
| `audit` | Evaluate | Checks técnicos (a11y, perf, responsivo) |
| `polish` | Refine | Passe final de qualidade |
| `animate` | Enhance | Motion com propósito |
| `colorize` | Enhance | Cor estratégica |
| `typeset` | Enhance | Hierarquia tipográfica |
| `layout` | Enhance | Espaçamento e ritmo |
| `chart` | Data | 25 tipos de gráfico com boas práticas |
| `form` | UX | Formulários com validação e feedback |
| `navigation` | UX | Padrões de navegação |

### Regras de roteamento

1. **Comando nomeado** → carregar o reference correspondente e seguir
2. **Sem argumento** → carregar `references/design/design-routing-reference.md` para recomendação por sinais
3. **Frase livre** → mapear intenção para o domínio mais próximo (§1–§10) e carregar reference correspondente
