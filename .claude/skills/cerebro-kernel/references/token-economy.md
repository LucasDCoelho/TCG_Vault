# Token Economy — Eficiência de Contexto e Paralelismo

## Princípio central

Token desperdiçado é decisão adiada. Contexto inchado é raciocínio degradado.
A meta não é usar poucos tokens — é usar os tokens certos no momento certo.

---

## Estratégia de contexto em camadas

Carregar apenas o que a tarefa atual exige. Nunca mais.

```
Camada 0 — Sempre presente (~3,9k tokens reais, SKILL.md tem 15.529 bytes)
  └── SKILL.md (este arquivo)

Camada 1 — Carga base por sessão (~5–8k tokens)
  └── STATE.md                    ← memória entre sessões
  └── PROJECT.md                  ← apenas se sessão envolve decisão de projeto

Camada 2 — Sob demanda por fase (~3–6k tokens cada)
  └── spec.md da feature ativa    ← apenas ao especificar ou implementar
  └── design.md                   ← apenas ao tomar decisão arquitetural
  └── tasks.md                    ← apenas ao executar tarefas

Camada 3 — Referências pontuais (carregar → usar → descartar)
  └── implement.md                ← consultar gate, não manter aberto
  └── validate.md                 ← apenas na fase de validação
  └── brownfield-mapping.md       ← apenas no primeiro mapeamento
  └── design-setup.md             ← ~4,4k tokens, apenas em tarefa de UI/frontend/design (setup + regras de roteamento + lookup rápido de comando)
  └── design-routing.md           ← ~2k tokens, apenas no caso "sem argumento" ou em `pin`/`unpin`/`hooks` — invocação direta de comando nomeado NÃO carrega este arquivo
  └── design/live.md              ← ~2,4k tokens, núcleo do loop — NUNCA a versão antiga monolítica de 15k tokens (fatiada em 2026-07-13, ver B01)
  └── design/live-generate.md     ← ~8,1k tokens, só na primeira vez que um evento `generate` chega na sessão (fica em contexto pros seguintes, não recarrega)
  └── design/live-events.md       ← ~2,1k tokens, só na primeira vez que `accept`/`discard`/`steer`/`prefetch`/`manual_edit_apply` chega
  └── design/live-fallback.md     ← ~0,7k tokens, só quando `live-wrap.mjs` retorna `fallback: "agent-driven"` (raro)
  └── design/live-setup.md        ← ~2,3k tokens, só na primeira configuração do projeto (config_missing/invalid) ou troubleshooting de CSP
  └── safe-guard.md                ← apenas em auditoria de risco de mudanças git
```

**Regra específica de `live`:** os quatro sub-arquivos de handler NUNCA são lidos preventivamente. O núcleo (`live.md`) só aponta pra eles quando o tipo de evento correspondente efetivamente chega no poll loop, e cada um é lido no máximo uma vez por sessão (fica em contexto depois). Ver detalhamento em "Sinais de alerta de custo" e no relatório `cerebro-kernel/.specs/project/reports/token-cost-baseline.md`.

**Regra de ouro:** Se um documento não influencia a próxima decisão, não está no contexto.

---

## O que nunca carregar simultaneamente

| ❌ Evitar | ✅ Em vez disso |
|----------|----------------|
| spec.md de múltiplas features | Apenas a feature ativa |
| Todos os docs de codebase | Apenas STACK.md + o doc relevante |
| design.md + tasks.md + implement.md juntos | Um por fase |
| design-setup.md + design.md/tasks.md juntos | design-setup.md sozinho — namespace de UI não se mistura com arquitetura/execução de feature |
| design-routing.md em toda invocação de design | Só no caso "sem argumento" ou `pin`/`unpin`/`hooks` — comando nomeado vai direto ao seu reference |
| Os 4 handlers de `live` (`live-generate.md`, `live-events.md`, `live-fallback.md`, `live-setup.md`) de uma vez | Um por tipo de evento, só quando esse evento chega no poll loop |
| ROADMAP.md durante implementação | Apenas STATE.md |
| Histórico de conversa inteiro | Resumir e compactar ao atingir limite |

---

## Compactação de contexto (quando acionar)

Sinalizar **⚠️ CONTEXTO ALTO** quando estimativa passar de 40k tokens.

Ao atingir o limite, executar compactação antes de continuar:

```
1. Extrair decisões tomadas → STATE.md (se ainda não estão lá)
2. Resumir histórico de implementação em 3–5 bullets no STATE.md
3. Descartar docs já usados (design.md se design está concluído)
4. Recomeçar com contexto limpo: STATE.md + spec.md ativa + tasks.md
```

Nunca compactar silenciosamente. Sempre avisar: "Contexto alto — compactando antes de continuar."

---

## Paralelismo de agentes

Quando uma tarefa pode ser decomposta em subtarefas **independentes**, executar em paralelo — não em sequência.

### Quando paralelizar

```
Paralelo ✅                          Sequencial ✅
─────────────────────────────────    ─────────────────────────────────
Múltiplos docs de codebase          Tasks com dependência entre si
Testes unitários de módulos          Commit → gate → próximo commit
diferentes
Gerar spec.md + context.md          Design → tasks (design informa tasks)
Implementar endpoints independentes  Specify → implement (spec vem antes)
Múltiplos brownfield docs           Deploy → validação (ordem importa)
```

### Como declarar paralelismo em tasks.md

```markdown
### T03 — Implementar [módulo A] [P]
### T04 — Implementar [módulo B] [P]
### T05 — Escrever testes para T03 e T04 [P]
# T03, T04 e T05 rodam em paralelo — sem dependência entre si

### T06 — Integrar T03 + T04
# T06 depende de T03 e T04 — sequencial
```

### Padrão de decomposição para brownfield mapping

O `map codebase` gera 7 documentos independentes. Paralelizar sempre:

```
Agente A → STACK.md + STRUCTURE.md
Agente B → ARCHITECTURE.md + INTEGRATIONS.md
Agente C → CONVENTIONS.md + TESTING.md + CONCERNS.md
```

Cada agente recebe apenas o contexto que precisa — não o conjunto completo.

### Padrão de decomposição para tasks grandes

Ao identificar tarefas [P] em tasks.md:

```
1. Agrupar por independência (sem dependência de dados entre si)
2. Cada grupo → contexto mínimo: STATE.md + spec.md + apenas as tasks do grupo
3. Consolidar resultados antes de avançar para tasks sequenciais
4. Gate de integração depois de consolidar — não antes
```

---

## Tamanho de resposta por fase

| Fase | Tamanho esperado | O que incluir |
|------|-----------------|---------------|
| Enquadramento (Kernel) | Curto (~200 palavras) | Matriz de priorização + decisão + próxima ação |
| Specify (Médio) | Médio (~400 palavras) | Tabela de requisitos + critérios de aceite |
| Design (Grande/Complexo) | Completo (necessário) | Opções + decisão + arquitetura + erros |
| Tasks | Conciso por tarefa | Uma tarefa = nome + onde + gate + rastreabilidade |
| Implement | Código + gate | Sem comentários óbvios no código, sem explicação do que é evidente |
| Quick fix | Mínimo viável | O que muda + gate + commit — nada mais |
| Para registrar | Fixo (5 campos) | Nunca expandir o bloco de registro |

**Regra de resposta:** Se a informação não muda a próxima ação do operador, não está na resposta.

---

## Compressão de linguagem

Kernel não repete o que o operador disse. Não parafraseando perguntas. Não confirmando que "entendeu o pedido".

```
❌ "Entendi que você quer implementar X. Vou fazer isso."
✅ [implementar diretamente]

❌ "Como você mencionou, o pregão tem prazo externo..."
✅ "Pregão tem deadline externo. Estimativa de velocidade não. Decisão: priorizar pregão."

❌ "Existem várias abordagens possíveis para este problema..."
✅ "Opção A ou B. Escolha A. Motivo: [razão]. Trade-off: [o que perde]."
```

---

## Sinais de alerta de custo ⚠️

Sinalizar automaticamente quando detectar:

| Sinal | Risco | Ação |
|-------|-------|------|
| Contexto estimado >40k tokens | Raciocínio degradado, custo alto | Compactar antes de continuar |
| Docs carregados sem uso na rodada | Tokens desperdiçados | Remover da próxima chamada |
| Resposta >800 palavras em fase simples | Prolixidade sem valor | Cortar ao que muda a próxima ação |
| Histórico longo sem checkpoint | Acúmulo sem propósito | Resumir → STATE.md → resetar |
| Task sequencial sendo paralelizada | Resultado incorreto | Corrigir ordem, não acelerar |
| Paralelismo disponível sendo ignorado | Custo de tempo e tokens | Decompor e paralelizar |

---

## Orçamento de tokens por tipo de sessão

Referência para calibrar profundidade:

| Tipo de sessão | Budget estimado | Como usar |
|----------------|----------------|-----------|
| Quick fix | ~2–5k | TASK.md + código + gate |
| Feature Médio | ~8–15k | spec + implement + validate |
| Feature Grande | ~20–35k | spec + design + tasks + implement + validate |
| Map codebase | ~25–43k | 7 docs em paralelo (3 agentes) |
| Decisão Kernel | ~4k | Enquadramento + matriz + registro (SKILL.md sozinho já é ~3,9k) |
| Ajuste de UI pontual (comando nomeado) | ~8–19k | design-setup.md (~4,4k, Camada 3) + reference do comando (0,8–9,5k) + edição — NÃO carrega design-routing.md |
| `live` — sessão típica (8–15 generates) | ~60–100k | Ver detalhamento abaixo. Ainda o comando mais caro do catálogo, mesmo pós-corte — o custo dominante é a saída (3 variantes reais por evento), não mais a carga de reference |
| Auditoria safe-guard | ~3–8k | safe-guard.md (Camada 3) + collect.sh + relatório |
| Sessão complexa com histórico longo | >40k ⚠️ | Compactar imediatamente |

### `live` — detalhamento pós-corte (2026-07-13)

Antes do corte (B01): reference monolítica de ~15k tokens carregada inteira toda sessão, reference de ação recarregada a cada `generate`, ~21k tokens de piso antes de gerar 1 variante. Sessão típica estimada em ~77–126k tokens.

Depois do corte:
- Piso da sessão: `live.md` (núcleo, ~2,4k) + `live-generate.md` (~8,1k, lido uma vez) ≈ **~10,5k tokens** antes da primeira variante — era ~21k.
- Reference de ação (`polish.md`, `typeset.md`, etc.) só recarrega se a sessão trocar de ação; a mesma ação repetida não paga a releitura.
- `live-events.md` (~2,1k) entra uma vez, tipicamente perto do fim (accept/discard).
- `live-setup.md` (~2,3k) e `live-fallback.md` (~0,7k) só entram nas sessões que realmente passam por primeira configuração ou fallback — a maioria não passa.
- **O que não mudou:** cada `generate` ainda escreve 3 variantes completas (HTML+CSS) e ainda lê o screenshot quando anotado — esse é o valor do modo, não overhead, e domina o custo total (~60–70% de uma sessão típica).

Resultado: **~60–100k tokens por sessão típica**, uma redução de ~20–30% sobre a estimativa pré-corte, sem perda de funcionalidade. Não é uma solução definitiva — é o teto do que dá pra cortar sem reduzir o número de variantes por rodada (decisão de produto, não de engenharia; ver `token-cost-baseline.md`).
