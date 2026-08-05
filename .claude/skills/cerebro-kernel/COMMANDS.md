# Cerebro Kernel — Catálogo completo de comandos

> Atualizado em 2026-07-15. Design capability via ui-ux-pro-max integrado. Impeccable removido.

Todo comando passa primeiro pelo enquadramento do Kernel (problema real → urgência×impacto → solução mínima → trade-offs) e pelo auto-sizing (Pequeno/Médio/Grande/Complexo) antes de executar. Os comandos abaixo são os **gatilhos de roteamento** — o que você diz para a skill entender o que fazer.

---

## 0. Ativação da skill (meta-comando)

| Gatilho | O que faz |
|---|---|
| "kernel", "modo kernel", "consulta o kernel", "análise fria", "decisão técnica objetiva", "o que o kernel acha" | Força o modo de raciocínio frio do Kernel — enquadramento explícito antes de qualquer proposta, sem elogio, sem enrolação |

---

## 1. Nível de projeto

| Comando | Gatilho | O que faz | Reference |
|---|---|---|---|
| **Initialize project** | "initialize project", "setup projeto", "começar do zero" | Bootstrap completo: cria `.specs/project/PROJECT.md`, `ROADMAP.md`, `STATE.md` vazio | `references/bootstrap.md` |
| **Map codebase** | "map codebase", "analisar código existente" | Gera os 7 docs brownfield em `.specs/codebase/` | `references/bootstrap.md`, `references/brownfield-mapping.md` |
| **Roadmap** | "roadmap", "planejar features" | Atualiza `ROADMAP.md` com features e milestones | — |
| **Registrar decisão** | "registrar decisão", "logar bloqueio" | Atualiza `STATE.md` com decisão/bloqueio | `references/state-management.md` |
| **Pause work** | "pause work", "encerrar sessão" | Session handoff — grava estado atual em `STATE.md` | `references/session-handoff.md` |
| **Resume work** | "resume work", "continuar" | Verifica `STATE.md` stale e carrega contexto | `references/session-handoff.md` |
| **Onboarding** | "onboarding", "como usar" | Explica o fluxo pelo papel do usuário | `references/onboarding.md` |

## 2. Nível de feature (auto-sized)

| Comando | Gatilho | O que faz | Reference |
|---|---|---|---|
| **Specify feature** | "specify feature", "definir requisitos" | Cria `spec.md` com IDs rastreáveis | `references/specify.md` |
| **Discuss feature** | "discuss feature", "como deve funcionar" | Captura decisões → `context.md` | `references/specify.md` |
| **Design feature** | "design feature", "arquitetura" | Cria `design.md` (Large/Complex) | `references/design.md` |
| **Tasks** | "tasks", "quebrar em tarefas" | Cria `tasks.md` com verificação | `references/tasks.md` |
| **Implement** | "implement", "executar", "build" | Implementa com commits atômicos | `references/implement.md` |
| **Validate** | "validate", "verificar", "UAT" | Verificação + relatório | `references/validate.md` |
| **Quick fix** | "quick fix", "bug fix" | Quick mode — TASK.md + implementar | `references/quick-mode.md` |

## 3. Design — ui-ux-pro-max integrado

Setup: Python disponível (`python3 --version` ou `python --version`). Carregar `references/design-setup.md` para regras de roteamento.

Busca principal: `python3 .claude/skills/cerebro-kernel/scripts/design/ui-ux/search.py "<query>" --design-system -p "ProjectName"`

| Comando | Gatilho | O que faz | Reference |
|---|---|---|---|
| **Design System** | "design system", "criar design system", "estilo do projeto" | Busca inteligente com `--design-system`: 67 estilos, 161 paletas, 57 font pairings, reasoning automático | `references/design/SKILL-UI-UX.md` |
| **Brand** | "brand", "identidade visual", "branding" | Brand identity, voz, guidelines, sync de tokens | `references/design/brand/SKILL.md` |
| **Logo** | "logo", "criar logo" | 55+ estilos, 30 paletas, 25 indústrias. Gemini AI | `references/design/extended-design-SKILL.md` |
| **Banner** | "banner", "criar banner" | 22 estilos multi-formato (social, ads, web, print) | `references/design/banner-design/SKILL.md` |
| **Slides** | "slides", "apresentação", "pitch deck" | Apresentações HTML com Chart.js + design tokens | `references/design/slides/SKILL.md` |
| **Icon** | "icon", "ícone" | 15 estilos SVG, Gemini 3.1 Pro | `references/design/extended-design-SKILL.md` |
| **Tokens** | "tokens", "design tokens", "theme" | Arquitetura Primitive → Semantic → Component | `references/design/design-system/SKILL.md` |
| **UI Styling** | "shadcn", "tailwind", "componentes" | shadcn/ui + Tailwind CSS + Canvas | `references/design/ui-styling/SKILL.md` |
| **Critique** | "critique", "review de UX" | Quick Reference §1–§10 com scoring | `references/design/SKILL-UI-UX.md` |
| **Audit** | "audit", "checar acessibilidade" | §1 Accessibility + §2 Touch + §3 Performance | `references/design/SKILL-UI-UX.md` |
| **Polish** | "polish", "refinar", "passe final" | Regras por categoria, pre-delivery checklist | `references/design/SKILL-UI-UX.md` |
| **Animate** | "animate", "animação", "motion" | §7 Animation — 28 regras de motion | `references/design/SKILL-UI-UX.md` |
| **Accessibility** | "accessibility", "a11y" | §1 — 15 regras CRITICAL | `references/design/SKILL-UI-UX.md` |
| **Typography** | "typography", "tipografia" | §6 Typography & Color | `references/design/SKILL-UI-UX.md` |
| **Layout** | "layout", "espaçamento", "grid" | §5 Layout & Responsive | `references/design/SKILL-UI-UX.md` |
| **Chart** | "chart", "gráfico", "data viz" | §10 Charts & Data — 25 tipos | `references/design/SKILL-UI-UX.md` |
| **Form** | "form", "formulário" | §8 Forms & Feedback | `references/design/SKILL-UI-UX.md` |
| **Navigation** | "navigation", "navegação" | §9 Navigation Patterns | `references/design/SKILL-UI-UX.md` |
| **Colorize** | "colorize", "cores" | §6 — paletas por produto/indústria | `references/design/SKILL-UI-UX.md` |
| **Social Photo** | "social photo", "foto rede social" | Multi-plataforma (IG, FB, LI, TW, TT) | `references/design/extended-design-SKILL.md` |
| **CIP** | "CIP", "identidade corporativa" | 50+ deliverables, 20 estilos | `references/design/extended-design-SKILL.md` |

Frase livre ("essa tela parece IA", "muda a cor desse botão") → mapear para domínio §1–§10 e rotear.

**Comandos de busca:**

```bash
# Design system completo
python3 scripts/design/ui-ux/search.py "beauty spa wellness" --design-system -p "Serenity"

# Busca pontual por domínio
python3 scripts/design/ui-ux/search.py "dark mode glassmorphism" --domain style
python3 scripts/design/ui-ux/search.py "saaS modern" --domain color
python3 scripts/design/ui-ux/search.py "animation accessibility" --domain ux
python3 scripts/design/ui-ux/search.py "trend comparison" --domain chart
python3 scripts/design/ui-ux/search.py "React performance" --stack react

# Logo com AI
python3 scripts/design/extended/logo/generate.py --brand "TechFlow" --style minimalist --industry tech

# Banner
# (via referência banner-sizes-and-styles.md)
```

**Design Dials (opcionais):** `--variance <1-10>`, `--motion <1-10>`, `--density <1-10>` — ajustam a saída do `--design-system`.

## 4. Safe-guard — auditoria de risco de mudanças git

| Comando | Gatilho | O que faz | Reference |
|---|---|---|---|
| **Modo commits** (default) | "isso pode quebrar?", "safe-guard", antes de commit/deploy/merge/PR | Audita últimos N commits via `scripts/collect.sh commits N` | `references/safe-guard.md` |
| **Modo agora** | "safe-guard agora", "antes de commitar" | Audita working tree via `scripts/collect.sh agora` | `references/safe-guard.md` |

---

## Comportamentos automáticos

- **Gatilhos de alerta** — escopo crescendo, decisão sem registro, spec incompleto, contexto alto (>40k tokens), STATE.md desatualizado, bootstrap incompleto.
- **Bloco "Para registrar"** — toda decisão técnica → Contexto/Decisão/Justificativa/Trade-offs/Revisar em.
- **Cadeia de verificação** — codebase → docs → busca web → sinalizar incerteza. Nunca fabricar.
