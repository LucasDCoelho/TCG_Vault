# Design — Decisões de Arquitetura

## Quando criar design.md

Apenas para features **Large** ou **Complex**:
- Novos módulos ou serviços
- Integração com sistema externo (nova API, novo serviço, nova dependência)
- Mudança que afeta mais de um módulo ou camada
- Trade-off arquitetural com impacto duradouro
- Feature que outros membros da equipe precisam entender para contribuir

Para features **Medium** com design direto → pular. Documentar decisão no "Para registrar".

---

## Formato de design.md

```markdown
# Design — [Nome da Feature]

## Contexto arquitetural
[Onde isso se encaixa no sistema atual — módulos afetados, fluxo existente]

## Problema a resolver
[Não o sintoma. O problema real que esta arquitetura precisa endereçar]

## Opções consideradas

### Opção A — [Nome]
**Como funciona:** [descrição técnica]
**Vantagens:** [o que isso resolve bem]
**Desvantagens / riscos:** [o que isso sacrifica ou pode dar errado]

### Opção B — [Nome]
**Como funciona:** [descrição técnica]
**Vantagens:**
**Desvantagens / riscos:**

## Decisão

**Escolha:** Opção [X]
**Justificativa:** [por que esta e não outra — ser específico]
**Trade-offs aceitos:** [o que conscientemente abrimos mão]

## Arquitetura da solução

### Componentes novos
| Componente | Camada / módulo | Responsabilidade |
|------------|----------------|-----------------|
| [Nome] | [onde se encaixa] | [o que faz] |

### Componentes modificados
| Componente | Tipo de mudança | Impacto |
|------------|----------------|---------|
| [Nome] | Extensão / Refactor / Interface nova | [o que muda] |

### Fluxo de dados
[Como os dados percorrem esta feature — do input ao output]

[Entrada] → [Módulo A] → [Módulo B] → [Persistência / Saída]

### Modelo de dados
[Novos campos, tabelas, collections, schemas — só o que muda]

[Nome da entidade / tabela / collection]:
{
  [campo]: [tipo]  // [observação relevante, se houver]
}

### Contratos de interface
[Endpoints novos ou modificados]

[MÉTODO] /[recurso]
Body: { [campos] }
Response: { [campos] }

### Estratégia de erro
[Como cada falha é tratada]

| Cenário | Comportamento esperado | Retry? |
|---------|----------------------|--------|
| [serviço externo indisponível] | [o que acontece] | Sim/Não |
| [dado inválido / fora do esperado] | [o que acontece] | Não |
| [timeout / lentidão] | [o que acontece] | Sim |

## Impacto em sistemas existentes
[O que pode quebrar ou mudar de comportamento]

## Plano de rollback
[Como reverter se der errado em produção]

## Dependências externas
[O que precisa estar pronto antes de implementar]

## Métricas de sucesso
[Como saber que funcionou — mensuráveis]
```

---

## Padrões arquiteturais do sistema

> Carregar de `.specs/codebase/ARCHITECTURE.md` e `.specs/codebase/CONVENTIONS.md` do projeto ativo. Não assumir padrões — ler o que está documentado no projeto antes de propor qualquer componente novo.

---

## Checklist antes de fechar o design.md

- [ ] Todas as opções relevantes foram consideradas (mínimo 2)?
- [ ] Trade-offs estão explícitos — não apenas vantagens?
- [ ] Fluxo de dados está completo do input ao output?
- [ ] Cenários de falha mapeados (indisponibilidade, timeout, dados inválidos)?
- [ ] Nomenclatura segue as convenções do projeto (ver CONVENTIONS.md)?
- [ ] Impacto em sistemas existentes avaliado?
- [ ] Plano de rollback existe?
- [ ] Tasks.md pode ser derivado deste design diretamente?
