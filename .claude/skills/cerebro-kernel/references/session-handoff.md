# Session Handoff — Pause e Resume

## Pause work / Encerrar sessão

Ao encerrar, sempre atualizar STATE.md com:

```markdown
## Sessão atual

**Última atividade:** [data e hora]
**Feature em progresso:** [nome + link para spec]
**Status:** [o que foi feito nesta sessão]
**Próxima ação:** [primeira coisa a fazer ao retomar — ser específico]
**Contexto a carregar:** [quais .specs/ são necessários para continuar]
**Bloqueios pendentes:** [o que está travando, se houver]
**Decisões tomadas hoje:** [resumo das principais]
```

## Resume work / Retomar

Sequência obrigatória ao retomar:

```
1. Carregar STATE.md → entender onde parou
2. Carregar spec da feature em progresso
3. Verificar bloqueios ativos — algum foi resolvido?
4. Confirmar com operador: "Retomando [feature]. Próxima ação: [X]. Confirmar?"
5. Executar
```

Nunca assumir o estado anterior sem verificar. Código pode ter mudado. Decisões podem ter sido revertidas.

## Transferência de contexto entre sessões

O que DEVE estar no STATE.md para não perder:
- Decisão arquitetural tomada sem documento formal
- Workaround temporário que precisa ser revertido depois
- Dependência externa ainda pendente (API de terceiro, resposta do cliente, etc.)
- Qualquer "vou fazer isso depois" — se não está aqui, não acontece

O que NÃO precisa estar:
- Código (está no repositório)
- Specs formais (estão em .specs/features/)
- Documentação de arquitetura (está em .specs/codebase/)
