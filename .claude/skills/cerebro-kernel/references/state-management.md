# State Management — Memória Persistente

## Protocolo de STATE.md stale (desatualizado)

O STATE.md é o único ponto de memória entre sessões. Se estiver errado, tudo que vier depois é construído sobre base podre.

### Detectar se o STATE.md está stale

Ao iniciar qualquer sessão, verificar:

```
1. Checar "Atualizado em:" no topo do arquivo
2. Se > 3 dias sem atualização → presumir stale, verificar antes de continuar
3. Se > 2 semanas sem atualização → PARAR. Não continuar sem revisão com o operador
4. Se "Feature em progresso" não bate com o código atual → STATE.md está stale
```

### O que fazer quando está stale

```
NÃO: continuar assumindo que o estado salvo é válido
NÃO: reescrever o STATE.md com base em suposições

SIM: sinalizar explicitamente ao operador:
  "STATE.md não atualizado desde [data]. Antes de continuar, preciso confirmar:
   1. [Feature X] ainda está em progresso ou foi concluída?
   2. O bloqueio [B01] foi resolvido?
   3. Alguma decisão foi tomada desde [data] que não está registrada?"

SIM: incorporar as respostas e atualizar o STATE.md antes de qualquer ação
```

### Sinais de corrupção silenciosa

Sinalizar ⚠️ imediatamente se detectar:

| Sinal | O que indica |
|-------|-------------|
| "Feature em progresso" já está merged | STATE.md não foi atualizado ao concluir |
| Bloqueio marcado como "Aberto" mas código mostra solução implementada | Resolução não foi registrada |
| "Próxima ação" contradiz o tasks.md atual | Tasks mudaram sem atualizar STATE |
| Decisão técnica no código sem entrada em "Decisões técnicas" | Decisão tomada fora do fluxo |

### Regra de ouro

STATE.md desatualizado é pior do que STATE.md vazio. Vazio sinaliza que não há contexto. Desatualizado dá falsa confiança e leva a ações incorretas.

Se não há certeza sobre o estado atual → perguntar. Sempre.

## STATE.md — Estrutura

```markdown
# STATE — [Nome do Projeto / Sistema]

Atualizado em: [data]

## Decisões técnicas

| Data | Decisão | Justificativa | Trade-off | Revisar em |
|------|---------|---------------|-----------|------------|
| [data] | [o que foi decidido] | [por quê] | [o que foi sacrificado] | [quando/se] |

## Bloqueios ativos

| ID | Bloqueio | Impacto | Responsável | Status |
|----|----------|---------|-------------|--------|
| B01 | [descrição] | [o que trava] | [quem] | Aberto / Resolvido |

## Lições aprendidas

- [data] — [o que aprendemos e não deve se repetir]

## Deferred ideas

- [ideia adiada conscientemente] — motivo: [por quê não agora]

## Preferências do operador

- [preferências de fluxo, ferramentas, convenções específicas da equipe]

## Sessão atual

**Última atividade:** [data]
**Feature em progresso:** [nome]
**Próxima ação:** [o que fazer ao retomar]
**Contexto a carregar:** [quais arquivos .specs/ são relevantes]
```

## Quando atualizar

- Toda decisão técnica → Decisões técnicas
- Todo bloqueio identificado → Bloqueios ativos
- Ao encerrar sessão → Sessão atual + Próxima ação
- Ao aprender algo que não deve se repetir → Lições aprendidas
- Ao adiar ideia conscientemente → Deferred ideas

## Regra de ouro

Se a informação não está no STATE.md, ela não existe para a próxima sessão.
Conhecimento tácito não escrito = ⚠️ risco de perda.
