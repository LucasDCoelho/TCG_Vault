# Self-Healing — Diagnóstico, Reparo e Verificação

## Princípio

Self-healing não é magia. É um protocolo estruturado: detectar → classificar → diagnosticar → reparar → verificar → registrar. O agente não "adivinha" o que quebrou — segue um fluxo determinístico.

---

## Taxonomia de falhas

| Tipo | Exemplo | Severidade | Healável? |
|------|---------|------------|-----------|
| **Syntax** | Erro de compilação, typo em import, vírgula faltando | Baixa | Sim, sempre |
| **Logic** | Condição invertida, loop infinito, null pointer | Média | Sim, com diagnóstico |
| **Integration** | API timeout, auth falhou, schema incompatível | Alta | Dependente |
| **Regression** | Teste que passava agora falha após mudança | Alta | Sim, se causa identificada |
| **Config** | Variável de ambiente faltando, porta errada, path incorreto | Baixa | Sim, sempre |
| **Architectural** | Componente precisa de redesign, padrão inadequado | Crítica | Não heal — escalate |

---

## Protocolo de healing

### Passo 1: Detect

```bash
# O detector é o gate que falhou. Sempre há um output de erro.
# Capturar:
# - stdout/stderr completo
# - exit code
# - último gate que passou (para isolar mudança)
# - diff do que mudou desde o último gate passando
```

### Passo 2: Classificar

```bash
# Ler output de erro e classificar:
# - Contém "SyntaxError", "Unexpected token", "cannot find module" → SYNTAX
# - Contém "TypeError", "undefined", "null", "condition" → LOGIC
# - Contém "timeout", "ECONNREFUSED", "401", "403" → INTEGRATION
# - Contém "expected X to equal Y" em teste → REGRESSION
# - Contém "ENOENT", "EACCENTS", "port" → CONFIG
# - Nenhum dos acima → classificar manualmente
```

### Passo 3: Diagnosticar

```
Para cada tipo:

SYNTAX:
  1. Localizar linha exata do erro
  2. Identificar o que mudou (git diff ou contexto)
  3. Causa provável: typo, import faltando, sintaxe de nova feature

LOGIC:
  1. Rastrear variável/condição até origem
  2. Verificar: o que era esperado vs. o que aconteceu
  3. Causa provável: condição invertida, edge case, dado null

INTEGRATION:
  1. Verificar se serviço externo está up
  2. Verificar se payload/response mudou
  3. Verificar se autenticação está válida
  4. Causa provável: serviço down, schema drift, token expirado

REGRESSION:
  1. Identificar qual teste falhou
  2. Identificar qual mudança afetou o teste
  3. Causa provável: mudança incidental em código compartilhado

CONFIG:
  1. Verificar arquivo de configuração
  2. Verificar variáveis de ambiente
  3. Verificar paths e portas
  4. Causa provável: esquecimento de config, ambiente diferente

ARCHITECTURAL:
  1. Verificar se mudança viola design.md
  2. Verificar se componente precisa de interface nova
  3. Causa provável: problema de design, não de implementação
```

### Passo 4: Reparar

**Regras de reparo:**
- Reparo é cirúrgico: mínimo necessário para o gate passar
- Não refatorar durante heal (refactoring é tarefa separada)
- Não mudar spec ou design durante heal
- Se o reparo requer mudança de escopo → PARAR, escalate

```bash
# Repair patterns por tipo:

SYNTAX:
  # Corrigir a linha exata do erro
  # Não mexer em mais nada

LOGIC:
  # Corrigir a condição/variável identificada
  # Adicionar guard clause se edge case
  # Não reestruturar lógica

INTEGRATION:
  # Adicionar retry com backoff se timeout
  # Adicionar fallback se serviço indisponível
  # Corrigir payload se schema mudou
  # NÃO mudar a integração inteira

REGRESSION:
  # Reverter a mudança que causou regressão
  # OU ajustar o teste se o comportamento novo é intencional
  # NUNCA deletar teste que falha

CONFIG:
  # Corrigir valor/config faltando
  # Adicionar validação de config no startup

ARCHITECTURAL:
  # NÃO heal. Escalate.
  # Motivo: healing não resolve problema de design
```

### Passo 5: Verificar

```bash
# Re-executar EXATAMENTE o gate que falhou
# Se passou → heal bem-sucedido
# Se falhou → classificar nova falha (pode ser diferente da original)
```

### Passo 6: Registrar

Atualizar `healingLog` no STATE.json:

```json
{
  "taskId": "T02",
  "cycle": 3,
  "attempt": 1,
  "originalError": "TypeError: Cannot read property 'id' of undefined",
  "classification": "LOGIC",
  "diagnosis": "userObj pode ser null quando email não existe no cache",
  "repair": "Adicionar guard clause: if (!userObj) return 404",
  "verification": "Gate passou no retry",
  "tokensUsed": 800,
  "timestamp": "2026-07-14T10:35:00Z"
}
```

---

## Limites de healing

| Regra | Limite | Ação ao atingir |
|-------|--------|-----------------|
| Tentativas por tarefa | 3 | Marcar tarefa como BLOCKED, continuar com outras |
| Falhas consecutivas (global) | 5 | PARAR loop, reportar |
| Heal que muda spec/design | 1 (zero tolerado) | PARAR, escalate |
| Heal que adiciona >1 arquivo | N/A | Não é heal, é feature. Escalar. |
| Ciclos sem progresso | 2 | PARAR, reportar |

---

## Padrões de healing comuns

### Padrão: Null guard
```
Sintoma: TypeError: Cannot read property X of undefined
Diagnóstico: Variável pode ser null/undefined em cenário não previsto
Reparo: Adicionar null check antes do acesso
Prevenção: Adicionar tipo/validação na origem dos dados
```

### Padrão: Timeout com retry
```
Sintoma: ECONNREFUSED ou Timeout after 30000ms
Diagnóstico: Serviço externo indisponível ou lento
Reparo: Adicionar retry com exponential backoff (3 tentativas)
Prevenção: Circuit breaker no cliente HTTP
```

### Padrão: Import faltando
```
Sintoma: Module not found / Cannot find module
Diagnóstico: Import não adicionado ou path incorreto
Reparo: Adicionar import correto
Prevenção: Lint rule para imports não usados/faltantes
```

### Padrão: Teste quebrado por mudança incidental
```
Sintoma: Teste que passava agora falha
Diagnóstico: Mudança afetou comportamento compartilhado
Reparo: Ajustar mock ou fixture, OU reverter mudança se acidental
Prevenção: Testes de integração + review de testes afetados
```

### Padrão: Schema incompatível
```
Sintoma: Unexpected field / Missing required field
Diagnóstico: Schema de input/output mudou
Reparo: Atualizar validação/transformação para novo schema
Prevenção: Schema validation no contrato de integração
```

---

## Anti-padrões de healing (NÃO fazer)

| Anti-padrão | Por quê | O que fazer |
|-------------|---------|-------------|
| "Tentar a mesma coisa de novo" | Se falhou 1x, vai falhar de novo | Diagnosticar antes de reparar |
| "Mudar tudo e rezar" | Não sabe o que causou o problema | Isolar causa, reparo cirúrgico |
| "Deletar o teste que falha" | Esconder problema não resolve | Corrigir código ou ajustar teste |
| "Adicionar try/catch genérico" | Engolir erro não é healing | Tratar erro específicamente |
| "Mudar o spec para caber no código" | Spec é contrato, código se adapta | Re-implementar conforme spec |
| "Pular a tarefa e seguir" | Acumula débito técnico | Marcar BLOCKED + escalate |

---

## Escalamento

### Quando escalate
- 3 healing attempts na mesma tarefa sem sucesso
- Heal requer mudança de spec ou design
- Heal requer nova dependência ou componente
- 2+ ciclos sem progresso

### O que incluir no escalate
```markdown
## Escalamento — [Feature] / [Task]

**Tarefa:** T0X
**Falhas:** 3 tentativas de healing
**Último erro:** [erro completo]
**Diagnóstico:** [o que foi tentado e por que falhou]
**Suspeita:** [causa raiz provável]
**Opções:**
1. [opção A com trade-off]
2. [opção B com trade-off]
**Recomendação:** [qual opção e por quê]
```

### Handoff ao Kernel
Após escalate, delegar ao cerebro-kernel para re-enquadramento:
- O problema é de implementação ou de design?
- Vale a pena continuar ou reavaliar a abordagem?
- Há dependência bloqueante que não foi identificada?
