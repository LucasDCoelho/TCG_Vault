# Cerebro Loop — Catálogo de Comandos

> Skill de orquestração autônoma do pipeline SDD. Executa o ciclo completo SPEC → DESIGN → TASKS → IMPLEMENT → TEST com self-healing, paralelismo de agentes e circuit breakers.

---

## Ativação

| Gatilho | O que faz |
|---------|-----------|
| "loop", "modo loop", "rodar loop" | Ativa o modo loop para a feature ativa |
| "executar pipeline completo" | Inicia pipeline SDD do zero |
| "SDD completo", "spec-driven completo" | Pipeline SDD completo |
| "autonomia total", "modo autônomo" | Execução autônoma com checkpoints |
| "build completo", "feature end-to-end" | Loop de ponta a ponta |
| "orquestrar", "ciclo completo" | Orquestração com paralelismo |
| "do spec ao teste" | Pipeline SDD contínuo |
| "self-healing" | Ativa modo com healing habilitado |
| "rodar sozinho", "executar tudo" | Loop autônomo completo |
| "rodar roadmap", "roadmap batch", "executar roadmap" | Batch de features do ROADMAP |
| "status roadmap", "progresso do roadmap" | Dashboard de progresso do ROADMAP |

---

## Comandos de controle do loop

| Comando | Gatilho | O que faz |
|---------|---------|-----------|
| **Init** | "iniciar loop", "começar ciclo" | Inicializa STATE.json, calibra por escopo |
| **Status** | "status do loop", "onde estou" | Mostra fase, ciclo, budget, circuit breakers |
| **Next** | "próxima fase", "avançar" | Avança para próxima fase do pipeline |
| **Pause** | "parar loop", "pause", "stop" | Pausa o loop, salva estado |
| **Resume** | "continuar loop", "retomar" | Retoma loop pausado |
| **Check** | "checar harness", "ver limits" | Verifica budget e circuit breakers |
| **Heal** | "heal tarefa", "reparar task" | Inicia healing de uma tarefa específica |
| **Report** | "relatório do loop", "resumo" | Gera relatório completo do ciclo |

---

## Comandos ROADMAP batch

| Comando | Gatilho | O que faz |
|---------|---------|-----------|
| **Roadmap** | "rodar roadmap", "ver roadmap" | Lista features do ROADMAP.md com status de loop |
| **Roadmap Run** | "executar roadmap", "roadmap batch" | Roda features pendentes via loop SDD (1 fase por chamada) |
| **Roadmap Status** | "status roadmap", "progresso" | Dashboard de progresso com barra e tabela |

---

## Comandos herdados do cerebro-kernel

O loop delega decisões pontuais ao Kernel:

| Comando | Quando no loop |
|---------|---------------|
| "kernel", "análise fria" | Re-enquadramento após falha de healing |
| "specify feature" | Fase SPEC (se não está no loop) |
| "design feature" | Fase DESIGN |
| "tasks" | Fase TASKS |
| "implement" | Fase IMPLEMENT |
| "validate" | Fase TEST |
| "quick fix" | Durante self-healing |

---

## Orquestração via script

```bash
# Single feature
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs init <feature> [scope]
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs next <feature>
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs status <feature>

# ROADMAP batch
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs roadmap [path]
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs roadmap-run [path] [--scope <scope>]
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs roadmap-status [path]

# Controle
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs check <feature>
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs pause <feature>
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs resume <feature>
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs heal <task-id> <feature>
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs report <feature>
```

---

## Fluxo típico de uso

### Single feature
```
1. Usuário: "loop, implementar módulo de X"
2. Loop: enquadramento (Kernel) → classifica como Complex
3. Loop: init fiscalizacao complex
4. Loop: SPEC → spec.md + context.md → gate passa
5. Loop: DESIGN → design.md → gate passa
6. Loop: TASKS → tasks.md com 6 tarefas, 4 paralelas
7. Loop: IMPLEMENT → 3 agentes paralelos → todos gates passam
8. Loop: TEST → 1 falha → SELF-HEAL → reparo → re-test → passa
9. Loop: DELIVER → commit + relatório + STATE.md atualizado
10. Usuário recebe: "✅ Loop completo em 4 ciclos. 1 healing. 0 escalations."
```

### ROADMAP batch
```
1. Usuário: "rodar o roadmap"
2. Loop: roadmap → lista 6 features, 4 pendentes
3. Loop: roadmap-run → inicia feature 1 (auth-jwt, large)
4. Loop: next auth-jwt → SPEC → DESIGN → TASKS → IMPLEMENT → TEST → DELIVER
5. Loop: roadmap-run → avança para feature 2 (crud-users, medium)
6. Loop: next crud-users → SPEC → IMPLEMENT → TEST → DELIVER
7. Loop: roadmap-run → avança para feature 3 (dashboard, complex)
8. Loop: dashboard trava em TEST → circuit breaker → pausado
9. Loop: roadmap-status → 2 completas, 1 pausada, 1 pendente
10. Usuário: "retomar dashboard" → resume → next → completa
11. Loop: roadmap-run → avança para feature 4
```

---

## Comportamentos automáticos

- **Budget 70%** → compactação de contexto automática
- **Budget 100%** → loop para, handoff para operador
- **5 falhas consecutivas** → circuit breaker, loop para
- **3 falhas na mesma tarefa** → tarefa marcada BLOCKED
- **2 ciclos sem progresso** → loop para, escalate
- **Escopo creep detectado** → re-enquadramento com Kernel
- **Heal muda spec/design** → não permitido, escalate
