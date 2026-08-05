# Quick Mode — Fluxo Express

## Quando usar
- ≤3 arquivos afetados
- Escopo descrito em uma frase
- Bug fix, ajuste de config, mudança pontual

## Fluxo

```
1. Descrever → O que precisa mudar e por quê (uma frase)
2. Enquadrar → Urgência × Impacto (rápido, não pular)
3. Implementar → Direto, sem spec formal
4. Verificar → Gate mínimo (teste ou smoke test)
5. Commit → Mensagem atômica e descritiva
6. Registrar → SUMMARY.md em .specs/quick/NNN-slug/
```

## Formato TASK.md (quick)

```markdown
# Quick Task — NNN: [slug]

**Data:** [data]
**Escopo:** [uma frase]
**Urgência:** Alta / Média / Baixa
**Impacto:** Alto / Médio / Baixo

## O que fazer
[descrição direta do que implementar]

## Gate de verificação
`[comando]` → esperado: [resultado]

## Commit
`[tipo]: [descrição concisa]`
```

## Formato SUMMARY.md (quick)

```markdown
# Summary — NNN: [slug]

**Concluído em:** [data]
**Arquivos alterados:** [lista]
**Gate:** [passou / falhou + output]
**Commit:** [hash ou mensagem]
**Notas:** [qualquer coisa relevante para o futuro]
```

## Exemplos de commits atômicos

```
fix: corrigir timeout em [serviço] quando [condição]
feat: adicionar endpoint /[recurso] com filtro por [campo]
refactor: extrair lógica de [responsabilidade] para [módulo]
config: ajustar [parâmetro] de [serviço] para [valor]
```

## Safety valve

Se durante o "Implementar" perceber que são >3 arquivos ou >5 passos → PARAR.
Criar spec.md formal e usar fluxo completo. Quick mode não é para esconder complexidade.
