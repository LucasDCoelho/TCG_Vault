# ROADMAP Batch — Execução em Lote de Features

## Princípio

O ROADMAP é uma fila de features. O batch runner processa cada uma pela fila, rodando o loop SDD completo para cada feature antes de avançar para a próxima. Não é paralelismo entre features — é serialização com checkpoint.

---

## Formato esperado do ROADMAP.md

O parser aceita os formatos padrão de markdown:

```markdown
## Features
- [ ] feature-a — prioridade alta
- [ ] feature-b — prioridade média — complexo
- [x] feature-c — concluída (já feita)
- [ ] feature-d — prioridade baixa

## Milestones
### v1.0
- [ ] feature-e
- [ ] feature-f — alta

### v2.0
- [ ] feature-g
```

### Regras de parsing

| Elemento | Como é detectado |
|----------|-----------------|
| Feature | `- [ ] nome` ou `- [x] nome` |
| Concluída | `[x]` ou `[X]` |
| Prioridade | Texto inline: `— alta`, `(prioridade média)`, `[baixa]` |
| Scope | Texto inline: `— complexo`, `— grande`, `— pequeno` |
| Milestone | Header `### v1.0` ou `## Milestone X` |
| Seção | Header `## Features`, `## Backlog`, etc. |

### Prioridades suportadas

| Texto | Mapeamento |
|-------|-----------|
| alta, high, urgente | `high` |
| média, media, medium | `medium` |
| baixa, low | `low` |
| futuro, future | `deferred` |

### Scopes suportados

| Texto | Mapeamento |
|-------|-----------|
| pequeno, small | `medium` (small não existe no loop, usa medium) |
| médio, medium | `medium` |
| grande, large | `large` |
| complexo, complex | `complex` |

Se nenhum scope for especificado, usa o default do comando (`--scope` ou `large`).

---

## Fluxo de execução do batch

```
1. Ler ROADMAP.md → extrair features pendentes (não concluídas)
2. Para cada feature pendente (ordem do documento):
   a. Verificar se loop pré-existe → se sim, pular ou retomar
   b. Criar STATE.json com scope apropriado
   c. Rodar pipeline SDD: SPEC → DESIGN → TASKS → IMPLEMENT → TEST
   d. Se falhou → self-healing
   e. Se heal falhou → marcar como pausada, continuar com próxima
   f. Se completou → marcar como concluída, avançar
3. Gerar resumo do batch
```

---

## Modo de execução

### Batch interativo (padrão)

O `roadmap-run` avança uma fase por chamada. Isso permite que o agente execute cada fase com contexto completo:

```bash
# Listar o que vai rodar
node orchestrator.mjs roadmap

# Rodar (avança 1 fase da primeira feature pendente)
node orchestrator.mjs roadmap-run

# Avançar próxima fase da mesma feature
node orchestrator.mjs next <feature-slug>

# Quando a feature completa, rodar de novo avança para a próxima
node orchestrator.mjs roadmap-run
```

### Batch completo (explícito)

Para rodar todas as fases de todas as features de uma vez, o agente deve:

```bash
# Loop externo: para cada feature pendente
for each feature in roadmap.pending:
  1. init <feature-slug> <scope>
  2. next <feature-slug>  # avança fase
  3. Repetir next até status = complete ou paused
  4. Se paused → reportar e continuar com próxima
```

---

## Tratamento de erros no batch

### Feature com loop pausado

```
1. Reportar: "Feature X pausada na fase Y"
2. Perguntar ao operador: retomar ou pular?
3. Se retomar → resume + next até completar
4. Se pular → marcar como skipped, continuar com próxima
```

### Circuit breaker atingido

```
1. Parar a feature atual
2. Reportar causa do circuit breaker
3. Perguntar ao operador: intervention ou skip?
4. Intervention → aguardar resolução manual
5. Skip → marcar como skipped, continuar com próxima
```

### Feature sem scope definido

```
1. Usar scope default (--scope ou large)
2. Se durante a SPEC ficar claro que o scope está errado:
   → Parar, reportar ao operador
   → Reiniciar com scope correto
```

---

## Estado do batch

O batch não mantém estado próprio — ele orquestra loops individuais. Cada feature tem seu propio `STATE.json`.

Para rastrear progresso do batch, usar o `roadmap-status`:

```
Roadmap: .specs/project/ROADMAP.md
Total: 8 | Feitas: 2 | Pendentes: 6

  [████████████░░░░░░░░░░░░░░░░░░] 25%

  Feature                  | Scope    | Loop Status       | Priority
  ─────────────────────────┼──────────┼───────────────────┼─────────
  auth-jwt                 | large    | ✓ loop            | ALTA
  crud-users               | medium   | ✓ loop            | média
  dashboard                | complex  | ▶ running tasks C2| ALTA
  api-rate-limit           | medium   | —                 | média
  notifications            | large    | —                 | baixa
  export-pdf               | medium   | —                 | média
  audit-log                | complex  | —                 | ALTA
  i18n                     | large    | —                 | baixa
```

---

## Regras fixas

1. **Uma feature por vez.** Não rodar duas features em paralelo no batch (cada uma tem seu loop, mas o batch é serial).
2. **Scope do ROADMAP respeitado.** Se a feature define scope, usar ele. Se não, usar default.
3. **Features concluídas puladas.** `[x]` no ROADMAP = não processar.
4. **Checkpoint entre features.** Após cada feature, salvar progresso e reportar antes de avançar.
5. **Operador pode intervir.** A qualquer momento, o operador pode pausar o batch e retomar depois.
6. **Budget por feature, não global.** Cada feature tem seu próprio budget. O batch não acumula tokens entre features.
