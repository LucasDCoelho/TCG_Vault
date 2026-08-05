# Harness — Guardrails, Budgets e Circuit Breakers

## Princípio

O harness é a cerca elétrica do loop. Não é sugestão — é limite duro. O loop para quando atinge o harness, não quando "acha que deve parar".

---

## Camadas de proteção

```
Camada 1 — Budget de recursos (tokens, tempo, ciclos)
Camada 2 — Circuit breakers (falhas consecutivas, por tarefa)
Camada 3 — Deteção de divergência (escopo creep, spec drift)
Camada 4 — Kill switch manual (operador pode parar a qualquer momento)
```

---

## Camada 1: Budget de recursos

### Limites por escopo

| Escopo | Tokens | Tempo | Ciclos máximos | Tarefas paralelas máx. |
|--------|--------|-------|----------------|----------------------|
| Medium | 15k | 15 min | 2 | 1 (sem paralelismo) |
| Large | 35k | 30 min | 4 | 3 |
| Complex | 60k | 60 min | 6 | 5 |

### Como medir

- **Tokens:** estimativa acumulada de input + output em todas as chamadas de agente
- **Tempo:** desde `init` até ciclo atual
- **Ciclos:** contador incrementado a cada volta completa do loop (SPEC→TEST)

### O que acontece ao atingir limite

| Limite atingido | Ação |
|-----------------|------|
| 70% tokens | Compactação automática (resumo → STATE.md, descartar contexto usado) |
| 90% tokens | Aviso + modo econômico (pular Design se possível, reduzir paralelismo) |
| 100% tokens | **PARAR.** Handoff para operador. |
| 100% tempo | **PARAR.** Handoff para operador. |
| Ciclos máximos | **PARAR.** Entregar o que tem. Registrar pendências. |

---

## Camada 2: Circuit Breakers

### Breaker por falhas consecutivas

```
Contador: 0
A cada falha de gate: incrementar
A cada sucesso: resetar para 0

Limite: 5 falhas consecutivas
Ação: PARAR → reportar → aguardar operador
```

### Breaker por falha por tarefa

```
Contador por tarefa: 0
A cada falha de gate na tarefa: incrementar

Limite: 3 falhas por tarefa
Ação: marcar tarefa como BLOCKED → pular → continuar com próximas
```

### Breaker por divergência de escopo

```
A cada implementação que afeta >2x arquivos previstos no tasks.md:
  → Aviso de escopo creep
  → Se >3x: PARAR → re-enquadrar com Kernel
```

### Breaker por ciclo sem progresso

```
Se um ciclo inteiro (SPEC→TEST) não resultou em:
  - Nenhuma tarefa marcada como done
  - Nenhum gate passando
  → Aviso: "Ciclo sem progresso"
  → Se 2 ciclos sem progresso: PARAR → escalate
```

---

## Camada 3: Deteção de divergência

### Spec drift

Comparar implementação com spec.md:
- Se código implementa algo NÃO listado no spec → flag
- Se spec tem requisito sem implementação correspondente → flag
- Ação: registrar divergência, perguntar ao operador se é intencional

### Design drift

Comparar implementação com design.md:
- Se componente novo foi criado sem estar no design → flag
- Se padrão arquitetural foi violado → flag
- Ação: registrar, decidir se é healable ou precisa de re-enquadramento

### Contexto creep

Monitorar tamanho do contexto carregado:
- Se >40k tokens estimados → compactação obrigatória
- Se compactação não resolve → parar e handoff

---

## Camada 4: Kill switch

### Ativação manual
Operador pode parar o loop a qualquer momento com:
- "parar loop", "stop", "pause", "interromper"

### Resposta ao kill switch
```
1. Parar execução imediatamente
2. Salvar estado atual em STATE.json
3. Atualizar STATE.md com checkpoint completo
4. Gerar relatório parcial (o que foi feito, o que falta)
5. Mensagem: "Loop pausado. Retomar com: loop continuar [feature]"
```

---

## Monitoramento contínuo

A cada iteração do loop, o orchestrator verifica:

```javascript
function checkHarness(state) {
  // Budget
  if (state.budgetUsed.tokens >= state.budgetLimit.tokens * 0.7) compact();
  if (state.budgetUsed.tokens >= state.budgetLimit.tokens) return 'STOP_BUDGET';
  if (state.budgetUsed.time >= state.budgetLimit.time) return 'STOP_TIME';

  // Circuit breakers
  if (state.circuitBreakers.currentFailures >= 5) return 'STOP_FAILURES';
  if (state.circuitBreakers.taskFailures[task] >= 3) return 'SKIP_TASK';

  // Progress
  if (state.cyclesWithoutProgress >= 2) return 'STOP_NO_PROGRESS';

  // Scope
  if (state.scopeDivergence > 3) return 'STOP_SCOPE_CREEP';

  return 'OK';
}
```

---

## Regras fixas

1. **Nunca desabilitar circuit breakers.** Eles existem para proteger o operador de si mesmo.
2. **Nunca ignorar budget.** Se acabou, acabou. Handoff é digno, não fracasso.
3. **Nunca fazer heal que muda spec/design.** Isso é scope creep disfarçado de correção.
4. **Sempre persistir estado antes de parar.** STATE.json + STATE.md atualizados.
5. **Sempre reportar ao operador quando para.** Nunca parar silenciosamente.
