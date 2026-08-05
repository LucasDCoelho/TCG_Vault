---
name: cerebro-loop
description: >
  Ative esta skill SEMPRE que o usuário invocar "loop", "modo loop", "rodar loop", "executar pipeline completo",
  "SDD", "spec-driven completo", "autonomia total", "build completo", "feature end-to-end", "orquestrar",
  "ciclo completo", "do spec ao teste", "pipeline autônomo", "self-healing", "modo autônomo", "rodar sozinho",
  "executar tudo", "ciclo SDD", "loop de desenvolvimento", ou qualquer variante que expresse intenção de
  executar o pipeline completo de desenvolvimento de forma autônoma e contínua. Esta skill orquestra o
  cerebro-kernel num loop contínuo com self-healing, paralelismo massivo de agentes e circuit breakers.
  Não pede permissão a cada passo — executa o ciclo completo com checkpoints de segurança.
  Diferente do cerebro-kernel (que responde sob demanda), o cerebro-loop roda como um harness autônomo:
  observa o estado, decide a próxima ação, executa, verifica, e repete até convergir ou atingir limite de segurança.
allowed-tools:
  - Bash(node .claude/skills/cerebro-loop/scripts/orchestrator.mjs *)
  - Bash(node .claude/skills/cerebro-kernel/scripts/design/*)
  - Bash(bash .claude/skills/cerebro-kernel/scripts/collect.sh *)
---

# Cerebro Loop — Orquestração Autônoma com Self-Healing

O cerebro-kernel decide. O cerebro-loop **executa em ciclo**.

Três pilares:
- **Loop Engineering** → ciclo OODA contínuo: Observar → Orientar → Decidir → Agir → Verificar → Repetir
- **Harness Engineering** → guardrails, circuit breakers, budgets, kill switches
- **Self-Healing** → falha detectada → diagnosticada → reparada → verificada → ciclo continua

---

## Arquitetura do loop

```
                    ┌─────────────────────────────────┐
                    │         INÍCIO / ENTRADA         │
                    │  (feature request ou task batch)  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │      FASE 0: ENQUADRAMENTO      │
                    │  (Kernel decide o que importa)   │
                    └───────────────┬─────────────────┘
                                    │
               ┌────────────────────▼────────────────────┐
               │          CICLO SDD (loop principal)     │
               │                                         │
               │  ┌─────────┐  ┌─────────┐  ┌────────┐  │
               │  │  SPEC   │→ │ DESIGN  │→ │ TASKS  │  │
               │  └────┬────┘  └────┬────┘  └───┬────┘  │
               │       │            │            │       │
               │       │     (pulado se Small)   │       │
               │       │            │            │       │
               │  ┌────▼────────────▼────────────▼────┐  │
               │  │         IMPLEMENT (paralelo)      │  │
               │  └────────────────┬──────────────────┘  │
               │                   │                     │
               │  ┌────────────────▼──────────────────┐  │
               │  │            TEST / VALIDATE        │  │
               │  └────────────────┬──────────────────┘  │
               │                   │                     │
               │         ┌─────────▼─────────┐          │
               │         │   GATE DE CICLO   │          │
               │         │  Passou? → Sair   │          │
               │         │  Falhou? → Heal   │          │
               │         └─────────┬─────────┘          │
               │                   │                     │
               │         ┌─────────▼─────────┐          │
               │         │  SELF-HEALING     │          │
               │         │  Diagnosticar →   │          │
               │         │  Reparar →        │          │
               │         │  Re-verificar     │          │
               │         └─────────┬─────────┘          │
               │                   │                     │
               │                   └─── loop de volta ───┘
               └─────────────────────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │      FASE FINAL: ENTREGA        │
                    │  Commit + State + Relatório      │
                    └─────────────────────────────────┘
```

---

## Estado do loop

O loop mantém estado persistente em `.specs/loop/STATE.json`:

```json
{
  "feature": "nome-da-feature",
  "phase": "spec|design|tasks|implement|test|heal",
  "cycle": 3,
  "maxCycles": 5,
  "startTime": "2026-07-14T10:00:00Z",
  "budgetUsed": { "tokens": 12000, "time": "8m" },
  "budgetLimit": { "tokens": 40000, "time": "30m" },
  "tasks": {
    "T01": { "status": "done", "gate": "pass", "healAttempts": 0 },
    "T02": { "status": "running", "gate": null, "healAttempts": 0 },
    "T03": { "status": "pending", "gate": null, "healAttempts": 0 }
  },
  "healingLog": [],
  "circuitBreakers": {
    "maxFailuresPerTask": 3,
    "maxConsecutiveFailures": 5,
    "maxCycles": 5,
    "currentFailures": 0
  }
}
```

---

## Protocolo de ativação

### 1. Enquadramento (delegado ao Kernel)

```
1. Carregar cerebro-kernel → enquadramento obrigatório
2. Classificar escopo (Small/Medium/Large/Complex)
3. Se Small → handoff direto ao cerebro-kernel quick mode (não ativar loop)
4. Se Medium/Large/Complex → ativar loop com pipeline calibrado
```

### 2. Calibração do loop

| Escopo | Ciclos máximos | Paralelismo | Self-healing | Budget tokens |
|--------|---------------|-------------|--------------|---------------|
| **Medium** | 2 | Sem | Leve (1 retry) | 15k |
| **Large** | 4 | Sim, até 3 agentes | Moderado (2 retries) | 35k |
| **Complex** | 6 | Sim, até 5 agentes | Forte (3 retries + escalate) | 60k |

### 3. Inicialização do ciclo

```bash
# Carregar estado do loop
node .claude/skills/cerebro-loop/scripts/orchestrator.mjs init [feature-name]

# Se estado pré-existe → resumir e perguntar: "Retomar de onde parou ou recomeçar?"
# Se novo → criar STATE.json + iniciar fase 0
```

---

## Fases do pipeline SDD

### Fase 0: Enquadramento (Kernel)
- Matriz de priorização
- Classificação de escopo
- Decisão: executar loop ou handoff

### Fase 1: Specify
- Criar `spec.md` com IDs rastreáveis
- Identificar áreas cinzas → context.md
- Gate: spec completo, todos os Must definidos

### Fase 2: Design (Large/Complex apenas)
- Criar `design.md` com opções e decisão
- Gate: opções consideradas, trade-offs explícitos, fluxo de dados completo

### Fase 3: Tasks
- Criar `tasks.md` com tarefas atômicas
- Marcar `[P]` onde paraleliza
- Definir gates por tarefa
- Gate: todas as tarefas têm critério verificável

### Fase 4: Implement (paralelo)
- Executar tarefas `[P]` em paralelo via subagentes
- Cada agente: contexto mínimo (STATE + spec + suas tasks)
- Commits atômicos por tarefa
- Gate: build passa, testes locais passam

### Fase 5: Test / Validate
- Gate técnico automático (testes, lint, build)
- UAT funcional se houver stakeholder
- Regressão
- Gate: 0 falhas bloqueantes

### Fase 6: Self-Healing (se gate falhou)
- Diagnosticar tipo de falha
- Aplicar reparo
- Re-verificar
- Se heal falhou 3x → escalate para operador

### Fase 7: Entrega
- Commit final
- Atualizar STATE.md
- Gerar relatório de ciclo
- Atualizar `.specs/loop/STATE.json`

---

## Circuit Breakers (Harness)

O loop **para imediatamente** quando:

| Breaker | Limite | Ação |
|---------|--------|------|
| Falhas consecutivas | 5 | Parar, reportar, aguardar operador |
| Falhas por tarefa | 3 | Pular tarefa, marcar como blocked, continuar |
| Ciclos máximos | 2–6 (por escopo) | Parar, entregar o que tem, reportar pendências |
| Budget tokens | Definido por escopo | Compactar ou parar |
| Tempo de sessão | 30 min | Handoff automático → STATE.md |
| Escopo creep | Detectado por divergência | Parar, re-enquadrar com Kernel |

---

## Self-Healing — protocolo

```
1. DETECT → gate falhou ou erro detectado
2. CLASSIFY → syntax / logic / integration / regression / config
3. DIAGNOSE → ler erro completo, identificar causa raiz
4. REPAIR → aplicar fix mínimo para o problema específico
5. VERIFY → re-executar gate que falhou
6. LOG → registrar no healingLog do STATE.json
7. DECIDE → passou? continuar. falhou? retry (se < limite). limite? escalate.
```

Regras:
- Nunca heal uma tarefa mais de 3 vezes sem escalate
- Nunca heal mudando o spec ou design (isso é scope creep, não healing)
- Heal reparo cirúrgico — mínimo necessário para o gate passar
- Se heal requer mudança arquitetural → PARAR e re-enquadrar com Kernel

---

## Paralelismo — orquestração de agentes

### Regra de independência
Só paralelizar se as tarefas NÃO compartilham:
- Arquivos escritos
- Dependências de dados
- Estado compartilhado

### Padrão Fan-Out / Fan-In

```
         ┌── Agente A (T01, T02) ──┐
START ───┤── Agente B (T03) ───────├──→ INTEGRAR → GATE → NEXT
         └── Agente C (T04, T05) ──┘
```

### Isolamento de contexto
Cada agente paralelo recebe:
- STATE.json (read-only snapshot)
- spec.md (completo)
- Apenas suas tasks.md extraídas
- Convenções do projeto (CONVENTIONS.md)

NÃO recebe:
- Tasks de outros agentes
- Histórico de conversa
- Design completo (só a seção relevante)

### Consolidação
Após todos os agentes paralelos terminarem:
1. Merge de resultados (sem conflito — agentes escrevem em arquivos distintos)
2. Gate de integração (build + testes combinados)
3. Se conflito → detectar e escalar

---

## Gestão de estado entre ciclos

### Persistência
- `.specs/loop/STATE.json` → estado máquina do loop
- `.specs/features/[feature]/` → artefatos SDD (spec, design, tasks)
- `.specs/project/STATE.md` → decisões e memória de longo prazo

### Compactação automática
Ao atingir 70% do budget de tokens:
1. Salvar progresso em STATE.json
2. Resumir ciclos anteriores em STATE.md (3 bullets por ciclo)
3. Descartar artefatos de fases concluídas do contexto
4. Reiniciar fase atual com contexto mínimo

### Handoff
Se o loop atingir limite de tempo ou token:
1. Pause no estado atual
2. Atualizar STATE.md com: onde parou, próxima ação, contexto necessário
3. Mensagem ao operador: "Loop pausado em [fase]. Retomar com: [comando]"

---

## Tom e estilo

- **Autônomo mas não arrogante.** Executa, mas sabe quando pedir ajuda.
- **Direto.** Status em uma linha por fase. Detalhe só quando falha.
- **Técnico.** Erros em stack trace, não em prosa.
- **Português brasileiro.**
- **Sem repetição.** Cada ciclo Reporta progresso, não resumo do que já disse.

---

## Diferença para o cerebro-kernel

| Aspecto | cerebro-kernel | cerebro-loop |
|---------|---------------|--------------|
| Modo | Sob demanda | Autônomo em ciclo |
| Pipeline | Manual por fase | Automático com gates |
| Self-healing | Não | Sim, com retries e escalate |
| Paralelismo | Marca [P] mas não executa | Executa via subagentes |
| Circuit breakers | Alertas | Breakers com limite duro |
| Estado | STATE.md apenas | STATE.json + STATE.md |
| Escopo | Qualquer tarefa | Features Medium+ com pipeline completo |

---

## Modo ROADMAP Batch

O loop processa uma feature por vez. O batch processa **todas as features do ROADMAP** sequencialmente.

```
ROADMAP.md → parser extrai features pendentes → fila de execução
                │
                ├── feature 1 → loop SDD completo → checkpoint
                ├── feature 2 → loop SDD completo → checkpoint
                ├── feature 3 → loop SDD completo → checkpoint
                └── ... até fila esgotar ou circuit breaker
```

### Comandos

```bash
# Listar features do ROADMAP com status de loop
node orchestrator.mjs roadmap [caminho-do-roadmap]

# Rodar batch (1 fase da primeira feature pendente por chamada)
node orchestrator.mjs roadmap-run [caminho] [--scope large]

# Dashboard de progresso do ROADMAP
node orchestrator.mjs roadmap-status [caminho]
```

### Como funciona na prática

```bash
# 1. Ver o que tem no ROADMAP
node orchestrator.mjs roadmap

# 2. Rodar batch — inicializa primeira feature pendente
node orchestrator.mjs roadmap-run

# 3. Agente executa a fase (ex: SPEC), depois:
node orchestrator.mjs next <feature-slug>

# 4. Repetir next até feature completar

# 5. Rodar roadmap-run de novo → avança para próxima feature
node orchestrator.mjs roadmap-run
```

### Prioridade e scope

O parser extrai prioridade e scope inline do ROADMAP:
- `— alta` ou `(prioridade alta)` → prioridade high
- `— complexo` ou `— grande` → scope complex/large
- Se não definido → prioridade medium, scope default

### Detalhes

Ver `references/roadmap-batch.md` — parsing de formatos, tratamento de erros, regras de batch.

---

## Referências

| Arquivo | Quando carregar |
|---------|----------------|
| `references/harness.md` | Toda sessão — configuração de guardrails e limits |
| `references/loop-protocol.md` | Toda sessão — ciclo OODA, transições de fase, convergência |
| `references/self-healing.md` | Ao ativar self-healing — diagnóstico e reparo |
| `references/parallelism.md` | Ao paralelizar agentes — fan-out, isolamento, consolidação |
| `references/sdd-pipeline.md` | Toda sessão — definição das fases, gates, artefatos |
| `references/roadmap-batch.md` | Ao rodar ROADMAP em lote — parsing, batch, checkpoint |
| `cerebro-kernel/references/*` | Delegar decisões pontuais ao Kernel durante o loop |

---

## Exemplo de ativação

**Usuário:** "Loop, implementar o módulo de fiscalização completo do zero."

**Cerebro Loop responde:**

**Enquadramento (Kernel):** Feature Complexa — módulo novo com captura, processamento, integração cloud.

**Calibração:** Ciclos máximos: 6. Paralelismo: até 5 agentes. Budget: 60k tokens.

**Pipeline:**
```
[CYCLE 1] SPEC → design.md + spec.md com 12 requisitos
[CYCLE 2] TASKS → 8 tarefas, 5 paralelas
[CYCLE 3] IMPLEMENT → 3 agentes paralelos (capture / process / cloud)
[CYCLE 4] TEST → gate técnico + UAT
[CYCLE 5] HEAL → 2 falhas detectadas, reparadas, verificadas
[CYCLE 6] ENTREGA → commit + relatório + STATE.md
```

**Status:** ✅ Convergiu em 6 ciclos. 2 heals aplicados. 0 escalations.
