# SDD Pipeline — SPEC → DESIGN → TASKS → IMPLEMENT → TEST

## Princípio

O pipeline SDD é a espinha dorsal do loop. Cada fase gera artefatos que a próxima fase consome. Nenhuma fase começa antes da anterior ter passado seu gate. Sem atalhos, sem pular etapas obrigatorias.

---

## Pipeline completo

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  SPEC   │───→│ DESIGN  │───→│  TASKS  │───→│IMPLEMENT │───→│  TEST   │
│         │    │         │    │         │    │          │    │         │
│ spec.md │    │design.md│    │tasks.md │    │  código  │    │ testes  │
│context.md│   │         │    │         │    │  commits │    │ relatório│
└─────────┘    └─────────┘    └─────────┘    └──────────┘    └─────────┘
   Gate 1        Gate 2         Gate 3         Gate 4          Gate 5
```

---

## Fase 1: SPEC

### Input
- Feature request (do operador ou do ROADMAP.md)
- Contexto do projeto (STATE.md, .specs/codebase/)

### Artefatos gerados
- `.specs/features/[feature]/spec.md`
- `.specs/features/[feature]/context.md` (se houver áreas cinzas)

### Gate 1: Spec completo

```markdown
# Checklist de validação do spec

- [ ] Nome da feature definido
- [ ] Contexto descrito (situação que gerou a necessidade)
- [ ] Problema real identificado (não o sintoma)
- [ ] ≥1 requisito Must definido com ID
- [ ] Critérios de aceite para cada Must
- [ ] Fora do escopo listado
- [ ] Dependências identificadas
- [ ] Riscos listados
```

### Auto-sizing do spec

| Requisitos Must | Profundidade |
|-----------------|-------------|
| 1–3 | Spec enxuto (tabela + critérios) |
| 4–8 | Spec padrão (completo) |
| 9+ | Spec completo + subseções por módulo |

---

## Fase 2: DESIGN

### Pular se
- Escopo Small/Medium
- Mudança direta sem decisão arquitetural

### Input
- spec.md (completo e gateado)
- .specs/codebase/ARCHITECTURE.md
- .specs/codebase/CONVENTIONS.md

### Artefatos gerados
- `.specs/features/[feature]/design.md`

### Gate 2: Design completo

```markdown
# Checklist de validação do design

- [ ] ≥2 opções consideradas
- [ ] Trade-offs explícitos para cada opção
- [ ] Decisão tomada com justificativa
- [ ] Componentes novos listados com responsabilidade
- [ ] Componentes modificados listados com impacto
- [ ] Fluxo de dados completo (input → output)
- [ ] Modelo de dados documentado
- [ ] Contratos de interface definidos
- [ ] Estratégia de erro por cenário
- [ ] Impacto em sistemas existentes avaliado
- [ ] Plano de rollback documentado
- [ ] Nomenclatura segue CONVENTIONS.md
```

---

## Fase 3: TASKS

### Pular se
- Escopo Small (≤3 passos óbvios)

### Input
- spec.md (completo e gateado)
- design.md (se existir)
- .specs/codebase/CONVENTIONS.md

### Artefatos gerados
- `.specs/features/[feature]/tasks.md`

### Gate 3: Tasks completo

```markdown
# Checklist de validação das tasks

- [ ] Toda tarefa tem: nome, onde, dependências, critérios verificáveis, gate
- [ ] Tarefas independentes marcadas com [P]
- [ ] Dependências entre tarefas são acíclicas (DAG)
- [ ] Toda task tem rastreabilidade para spec (R0X)
- [ ] Gates usam comandos reais do projeto (não genéricos)
- [ ] Número de tarefas: ≥1 e ≤20
```

### Decomposição de tasks

| Tasks | Ação |
|-------|------|
| 1–3 | Executar inline (sem tasks.md formal) |
| 4–10 | tasks.md padrão |
| 11–20 | tasks.md com grupos e subseções |
| 20+ | Reavaliar escopo com Kernel (possível feature demais para um ciclo) |

---

## Fase 4: IMPLEMENT

### Input
- tasks.md (completo e gateado)
- spec.md (referência)
- design.md (referência, se existir)
- .specs/codebase/CONVENTIONS.md

### Processo

```
Para cada task (respeitando dependências):
  1. Ler task + critérios
  2. Verificar: dependências anteriores completas?
  3. Implementar código
  4. Escrever testes (mesmo commit)
  5. Executar gate da task
  6. Se passou → commit atômico → marcar done
  7. Se falhou → self-healing
  8. Se heal falhou → marcar blocked → continuar com próximas independentes
```

### Commit convention

```
feat: implementar [componente] para [contexto]
fix: corrigir [problema] em [módulo] quando [condição]
refactor: extrair [responsabilidade] de [origem] para [destino]
test: cobrir [caso] em [módulo]
```

### Gate 4: Build + lint + unit tests

```bash
# Build completo
[comando de build do projeto]

# Lint
[comando de lint do projeto]

# Testes unitários
[comando de test runner do projeto]
```

### Paralelismo na implementação

Identificar no tasks.md quais tasks são `[P]`:
- Tasks `[P]` → subagentes paralelos (ver references/parallelism.md)
- Tasks sem `[P]` → sequencial na ordem de dependência
- Após grupo paralelo → gate de integração antes de avançar

---

## Fase 5: TEST / VALIDATE

### Input
- Código implementado (todos os commits feitos)
- spec.md (critérios de aceite)
- tasks.md (gates executados)

### Tipos de teste

#### 5.1 Gate técnico (automático)
```bash
# Testes unitários (já executados no implement, re-executar para confirmar)
[comando de testes]

# Testes de integração (se existirem)
[comando de testes de integração]

# Lint completo
[comando de lint]

# Type check (se aplicável)
[comando de typecheck]
```

#### 5.2 Coverage check
```bash
# Verificar cobertura dos requisitos
# Para cada R0X no spec → verificar se há teste correspondente
[comando de coverage]
```

#### 5.3 UAT funcional (se houver stakeholder)
Percorrer critérios de aceite do spec.md:
```
Para cada critério R0X:
  1. Descrever cenário
  2. Executar
  3. Registrar: Passou / Falhou / Parcial
  4. Se falhou → self-healing ou escalate
```

#### 5.4 Regressão
```bash
# Rodar suite completa de testes
[comando de testes]

# Verificar que funcionalidades existentes não quebraram
[smoke tests se existirem]
```

### Gate 5: Validação completa

```markdown
# Checklist de validação final

- [ ] Testes unitários: todos passando
- [ ] Testes de integração: todos passando (se existirem)
- [ ] Lint: 0 erros
- [ ] Type check: 0 erros (se aplicável)
- [ ] Coverage: ≥threshold do projeto
- [ ] Critérios de aceite: todos os Must aprovados
- [ ] Regressão: 0 falhas
- [ ] Issues bloqueantes: 0 abertas
```

---

## Transição entre fases

### Sempre persistir antes de transição

```json
{
  "transition": "spec → design",
  "cycle": 1,
  "timestamp": "2026-07-14T10:15:00Z",
  "gateResult": "pass",
  "artifacts": ["spec.md", "context.md"],
  "tokensUsed": 5000
}
```

### Se gate falhou
1. Não transicionar
2. Self-healing no artefato da fase atual
3. Re-verificar gate
4. Se heal falhou 3x → escalate

---

## Artefatos esperados por fase

| Fase | Arquivo | Obrigatório? | Tamanho esperado |
|------|---------|-------------|-----------------|
| SPEC | spec.md | Sim | 200–800 palavras |
| SPEC | context.md | Se áreas cinzas | 100–400 palavras |
| DESIGN | design.md | Large/Complex | 400–1200 palavras |
| TASKS | tasks.md | Large/Complex | 300–1000 palavras |
| IMPLEMENT | código + commits | Sim | Variável |
| TEST | relatório | Sim | 200–500 palavras |

---

## Validação cruzada

Antes de marcar ciclo como completo:

```
1. spec.md → todos os Must têm implementação correspondente?
2. tasks.md → todas as tasks estão done?
3. commits → há commit para cada task?
4. testes → há teste para cada critério de aceite?
5. design.md → componentes implementados batem com design?
```

Se qualquer resposta for "não" → não entregar. Voltar e completar.
