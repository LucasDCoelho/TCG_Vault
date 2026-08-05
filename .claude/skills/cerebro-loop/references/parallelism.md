# Parallelism — Orquestração de Agentes Paralelos

## Princípio

Paralelismo real não é "fazer duas coisas ao mesmo tempo". É identificar dependências, isolar contextos, executar independentes simultaneamente, e consolidar resultados sem conflito.

---

## Grafo de dependências

Antes de paralelizar, construir o grafo:

```
T01 (spec) ──→ T02 (design) ──→ T03 (task A) ──→ T06 (integração)
                                  T04 (task B) ──→ T06
                                  T05 (task C) ──→ T06
```

### Regra fundamental
Duas tarefas são paralelizáveis **se e somente se**:
1. Não escrevem no mesmo arquivo
2. Não dependem de output uma da outra
3. Não compartilham estado mutável

### Construção do grafo

```bash
# Para cada task em tasks.md:
# 1. Listar arquivos que a task escreve
# 2. Listar arquivos que a task lê (inputs)
# 3. Listar tasks que declara como dependência

# Regra de conflito:
# Task A escreve em X ∧ Task B lê/escreve X → A e B são sequenciais
# Task A depende de T01 ∧ Task B depende de T01 → A e B podem ser paralelas
```

---

## Padrões de paralelismo

### Padrão 1: Fan-Out puro

```
         ┌── Agente A ──┐
START ───┤── Agente B ───├──→ CONSOLIDAR → GATE
         └── Agente C ──┘
```

**Quando usar:** Tasks independentes que não se encontram até a integração
**Exemplo:** Implementar 3 endpoints diferentes, cada um em seu arquivo

### Padrão 2: Fan-Out com dependência parcial

```
START ─── T01 (base) ──┬── Agente A (depende de T01) ──┐
                        └── Agente B (depende de T01) ──├──→ GATE
                                                         │
                        Agente C (independente) ─────────┘
```

**Quando usar:** Uma task cria base que outras consomem, mas há tasks independentes
**Exemplo:** Criar modelo de dados + endpoints que usam o modelo, em paralelo com testes de integração que mockam o modelo

### Padrão 3: Pipeline paralelo

```
START ──→ [A1, A2, A3] ──→ [B1, B2] ──→ [C1] ──→ GATE
           Grupo 1            Grupo 2      Grupo 3
```

**Quando usar:** Fases do pipeline com tarefas internas paralelas
**Exemplo:** 3 endpoints em paralelo → 2 testes em paralelo → 1 integração

### Padrão 4: Map-Reduce

```
         ┌── Map A ──┐
START ───┤── Map B ───├──→ REDUCE → GATE
         └── Map C ──┘
```

**Quando usar:** Processar dados em paralelo, consolidar resultado
**Exemplo:** Migrar dados de 3 tabelas em paralelo → consolidar verificação

---

## Isolamento de contexto

### O que cada agente paralelo recebe

```json
{
  "agentId": "agent-A",
  "scope": {
    "tasks": ["T03", "T04"],
    "files": ["src/module-a/*.ts", "tests/module-a/*.ts"],
    "context": {
      "STATE.json": "snapshot somente leitura",
      "spec.md": "completo",
      "CONVENTIONS.md": "completo",
      "design.md": "seção relevante apenas"
    }
  },
  "constraints": {
    "maxTokens": 10000,
    "timeout": "10m",
    "allowedFiles": ["src/module-a/", "tests/module-a/"],
    "blockedFiles": ["src/module-b/", "src/shared/"]
  }
}
```

### O que cada agente NÃO recebe

- Tasks de outros agentes
- Histórico de conversa do loop principal
- State completo do loop (só snapshot)
- Diretório de outros módulos (só o seu)

### Regra de escrita
Cada agente só pode escrever em:
- Seus próprios arquivos designados
- Arquivos de teste que criou
- Nenhum arquivo compartilhado

---

## Consolidação de resultados

### Pós-execução paralela

```
1. Collect → cada agente retorna:
   - Status: done / failed / blocked
   - Arquivos criados/modificados
   - Output de gate (passou/falhou)
   - Erro (se houver)

2. Merge → consolidar:
   - Todos os arquivos criados/modificados
   - Nenhum conflito (agentes escrevem em arquivos distintos)
   - Se conflito detectado → PARAR, reportar ao operador

3. Integration Gate → executar:
   - Build completo (todos os módulos)
   - Testes de integração (se existirem)
   - Lint no escopo total

4. Se integration gate passa → avançar
   Se falha → self-healing no resultado consolidado
```

### Detecção de conflito

```bash
# Antes de consolidar, verificar:
# 1. Dois agentes escreveram no mesmo arquivo? → CONFLITO
# 2. Agente A criou arquivo que Agente B deletou? → CONFLITO
# 3. Agente A modificou linha que Agente B modificou? → CONFLITO

# Se conflito:
#   → Listar arquivos conflitantes
#   → Listar natureza do conflito
#   → Escalar para operador decidir
#   → NÃO tentar auto-merge (risco alto)
```

---

## Scheduling de agentes

### Ordem de execução

```
1. Tasks sem dependências → agente imediatamente
2. Tasks com dependências → agente quando dependência completa
3. Tasks bloqueadas → marcar, não agendar
```

### Limites de concorrência

| Escopo | Agentes simultâneos |
|--------|-------------------|
| Medium | 1 (sem paralelismo real) |
| Large | até 3 |
| Complex | até 5 |

### Timeout por agente

```json
{
  "agentTimeout": {
    "Medium": "10m",
    "Large": "15m",
    "Complex": "20m"
  }
}
```

Se agente exceder timeout:
1. Marcar como TIMEOUT
2. Coletar o que foi feito até então
3. Decidir: re-executar com contexto parcial OU escalar

---

## Exemplo concreto: Fan-Out para 3 endpoints

```markdown
# Tasks.md com paralelismo

### T01 — Criar modelo de dados [P]
**Onde:** src/models/user.ts
**Feito quando:** schema definido, migration criada
**Gate:** npx prisma migrate dev → ok

### T02 — Criar endpoint CRUD de usuários [P]
**Depende de:** T01
**Onde:** src/routes/users.ts, src/controllers/userController.ts
**Feito quando:** GET/POST/PUT/DELETE funcionam
**Gate:** curl localhost:3000/users → 200

### T03 — Criar endpoint CRUD de pedidos [P]
**Depende de:** T01
**Onde:** src/routes/orders.ts, src/controllers/orderController.ts
**Feito quando:** GET/POST/PUT/DELETE funcionam
**Gate:** curl localhost:3000/orders → 200

### T04 — Criar endpoint de relatórios [P]
**Depende de:** T01
**Onde:** src/routes/reports.ts, src/controllers/reportController.ts
**Feito quando:** GET /reports retorna dados
**Gate:** curl localhost:3000/reports → 200

### T05 — Testes de integração [P]
**Depende de:** T02, T03, T04
**Onde:** tests/integration/
**Feito quando:** todos os testes passam
**Gate:** npx jest tests/integration/ → all pass
```

### Execução
```
Grupo 1 (paralelo): T01
Grupo 2 (paralelo): T02, T03, T04 [P] ← todos dependem de T01, mas são independentes entre si
Grupo 3 (sequencial): T05 ← depende de T02, T03, T04

Agentes:
  Agent Base → T01
  Agent A → T02 (contexto: T01 done, spec, user routes)
  Agent B → T03 (contexto: T01 done, spec, order routes)
  Agent C → T04 (contexto: T01 done, spec, report routes)
  Agent D → T05 (contexto: T02-T04 done, test framework)
```
