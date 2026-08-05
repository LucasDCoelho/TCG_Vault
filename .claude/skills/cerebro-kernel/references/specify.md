# Specify — Requisitos com Rastreabilidade

## Quando usar
- Feature média, grande ou complexa
- Qualquer coisa que afete mais de 3 arquivos ou envolva integração externa

## Formato de spec.md

```markdown
# [Nome da Feature]

## Contexto
[Situação que gerou a necessidade — sem florear]

## Problema real
[O que está quebrando ou faltando — sintoma vs. causa]

## Requisitos

| ID | Requisito | Prioridade | Notas |
|----|-----------|------------|-------|
| R01 | [descrição] | Must / Should / Nice | |
| R02 | [descrição] | Must / Should / Nice | |

## Fora do escopo
[O que explicitamente NÃO será feito nesta iteração]

## Critérios de aceite
- [ ] R01: [como verificar]
- [ ] R02: [como verificar]

## Dependências
[Outros sistemas, serviços, ou features que isso depende]

## Riscos identificados
[O que pode dar errado — serviços externos, casos de borda do domínio, volume, concorrência]
```

## Áreas cinzas → discuss

Se detectar ambiguidade que bloqueia decisão de design, acionar discuss antes de prosseguir:

- Comportamento em casos de borda (serviço externo indisponível, dado inválido, timeout)
- Regras de negócio não documentadas (janelas de tempo, limites, jurisdição/escopo)
- Trade-offs de performance vs. precisão ou consistência

Registrar decisões no `context.md` da feature.
