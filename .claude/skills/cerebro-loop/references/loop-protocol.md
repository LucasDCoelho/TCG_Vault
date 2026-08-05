# Loop Protocol — Ciclo OODA e Transições de Fase

## Princípio

O loop não é um `while(true)` cego. É um ciclo OODA com pontos de verificação em cada transição. Cada volta gera informação que alimenta a próxima.

---

## Ciclo OODA adaptado

```
OBSERVAR → ORIENTAR → DECIDIR → AGIR → VERIFICAR → (loop)
   │           │          │        │          │
   │           │          │        │          └─ Gate: passou? → próxima fase / heal
   │           │          │        └─ Executar fase do pipeline SDD
   │           │          └─ Kernel decide: prosseguir, pular, ou parar
   │           └─ Contexto: onde estou, o que mudou, o que descobri
   └─ Ler estado: STATE.json, gates anteriores, healing log
```

---

## Máquina de estados

```
                    ┌──────────┐
                    │  IDLE    │ ← estado inicial / após handoff
                    └────┬─────┘
                         │ init
                    ┌────▼─────┐
               ┌────│ ENQUADRAR│────┐
               │    └──────────┘    │
               │ Small?             │ Complex?
          ┌────▼────┐          ┌────▼──────┐
          │ QUICK   │          │   FULL    │
          │ (Kernel)│          │   LOOP    │
          └─────────┘          └─────┬─────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │                                 │
               ┌────▼────┐  ┌─────────┐  ┌────────▼──┐
               │  SPEC   │→ │ DESIGN  │→ │   TASKS   │
               └────┬────┘  └────┬────┘  └─────┬─────┘
                    │            │ (pulado      │
                    │            │ se Medium)   │
                    │            │              │
               ┌────▼────────────▼──────────────▼────┐
               │            IMPLEMENT                │
               └────────────────┬────────────────────┘
                                │
               ┌────────────────▼────────────────────┐
               │              TEST                   │
               └────────────────┬────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      GATE CHECK       │
                    └───────┬───────┬───────┘
                            │       │
                     Passou │       │ Falhou
                            │       │
                    ┌───────▼──┐ ┌──▼──────────┐
                    │ NEXT     │ │ SELF-HEAL   │
                    │ PHASE    │ └──────┬──────┘
                    └───────┬──┘        │
                            │     ┌─────▼─────┐
                            │     │ Heal OK?  │
                            │     └──┬─────┬──┘
                            │  Sim   │     │ Não
                            │        │     │
                            │  ┌─────▼──┐ ┌▼──────────┐
                            │  │ RETRY  │ │ ESCALATE  │
                            │  └────────┘ └─────┬─────┘
                            │                    │
                    ┌───────▼────────────────────▼───┐
                    │          ENTREGA               │
                    └───────────────┬────────────────┘
                                    │
                            ┌───────▼───────┐
                            │   COMPLETE    │
                            └───────────────┘
```

---

## Transições de fase

### SPEC → DESIGN
**Condição:** spec.md completo, todos os Must definidos, áreas cinzas resolvidas ou registradas em context.md
**Gate:** spec tem ≥1 requisito Must, critérios de aceite definidos, fora do escopo listado
**Pular para TASKS se:** escopo Medium (design é direto)

### DESIGN → TASKS
**Condição:** design.md completo (se aplicável), opções avaliadas, decisão tomada
**Gate:** fluxo de dados definido, componentes mapeados, estratégia de erro documentada
**Pular se:** escopo Small/Medium

### TASKS → IMPLEMENT
**Condição:** tasks.md com tarefas atômicas, gates definidos, dependências mapeadas
**Gate:** toda task tem critério verificável, tarefas [P] identificadas
**Pular se:** escopo Small (implementar direto)

### IMPLEMENT → TEST
**Condição:** todas as tarefas done, commits atômicos realizados
**Gate:** build passa, lint passa, testes unitários passam

### TEST → ENTREGA (se passou)
**Condição:** 0 falhas bloqueantes, UAT conduzido (se aplicável)
**Gate:** checklist pré-deploy completo

### TEST → SELF-HEAL (se falhou)
**Condição:** gate de teste falhou
**Ação:** diagnosticar → reparar → re-testar

### SELF-HEAL → IMPLEMENT (se heal OK)
**Condição:** reparo verificado, gate passa agora
**Ação:** commit do reparo → voltar ao pipeline

### SELF-HEAL → ESCALATE (se heal falhou 3x)
**Condição:** 3 tentativas de healing sem sucesso
**Ação:** handoff para operador com diagnóstico completo

---

## Progressão por escopo

### Medium (2 ciclos)
```
Ciclo 1: SPEC → [pular design] → [pular tasks] → IMPLEMENT → TEST
Ciclo 2: HEAL (se necessário) → ENTREGA
```

### Large (4 ciclos)
```
Ciclo 1: SPEC
Ciclo 2: [pular design] → TASKS → IMPLEMENT (início)
Ciclo 3: IMPLEMENT (conclusão) → TEST
Ciclo 4: HEAL (se necessário) → ENTREGA
```

### Complex (6 ciclos)
```
Ciclo 1: SPEC → DESIGN
Ciclo 2: TASKS → IMPLEMENT (grupo paralelo A)
Ciclo 3: IMPLEMENT (grupo paralelo B) → INTEGRAÇÃO
Ciclo 4: IMPLEMENT (grupo paralelo C)
Ciclo 5: TEST → HEAL
Ciclo 6: HEAL (se necessário) → ENTREGA
```

---

## Feedback loops entre ciclos

Cada ciclo gera informação que alimenta o próximo:

### LOOP 1 → LOOP 2
- Spec identificou áreas cinzas → design deve endereçar
- Tasks identificaram dependências ocultas → implement deve antecipar

### LOOP 2 → LOOP 3
- Implement revelou complexidade inesperada → tasks pode precisar de novas tarefas
- padrões emergentes no código → convenções podem atualizar CONVENTIONS.md

### LOOP N → LOOP N+1
- Healings bem-sucedidos → padrão documentar para prevenir
- Falhas recorrentes → sinalizar para design reconsiderar abordagem

---

## Convergência

O loop converge quando:
1. Todos os gates passam
2. Nenhum healing necessário no ciclo
3. Spec coverage: 100% dos Must implementados
4. Regressão: 0 falhas

O loop diverge (para) quando:
1. Circuit breaker atingido
2. 2+ ciclos sem progresso mensurável
3. Heal requer mudança de spec/design
4. Operador envia kill switch

---

## Checkpoint a cada transição

Antes de cada transição de fase, persistir:

```json
{
  "from": "implement",
  "to": "test",
  "cycle": 3,
  "timestamp": "2026-07-14T10:30:00Z",
  "tasksDone": ["T01", "T02", "T03"],
  "tasksPending": ["T04"],
  "gatesPassed": ["T01", "T02"],
  "gatesFailed": [],
  "tokensUsed": 18000,
  "healingLog": []
}
```
