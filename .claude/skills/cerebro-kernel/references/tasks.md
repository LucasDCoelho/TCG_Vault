# Tasks — Tarefas Atômicas com Verificação

## Quando criar tasks.md
- Feature grande ou complexa
- Mais de 5 passos de implementação
- Dependências entre partes
- Execute inline revelou >5 passos (safety valve)

## Formato de tasks.md

```markdown
# Tasks — [Nome da Feature]

## Status geral
[ ] Em planejamento | [ ] Em execução | [ ] Concluído

## Tarefas

### T01 — [Nome da tarefa]
**O quê:** [descrição de uma linha]
**Onde:** [arquivos ou módulos afetados]
**Depende de:** [T0X ou "nenhuma"]
**Reutiliza:** [código/padrão existente, se aplicável]
**Paralela:** S/N
**Feito quando:**
- [ ] [critério verificável 1]
- [ ] [critério verificável 2]
**Gate:** `[comando de verificação]` → esperado: [resultado]
**Rastreabilidade:** R0X, R0Y

---

### T02 — [Nome da tarefa]
...
```

## Convenções de nomenclatura

Seguir as convenções do projeto ativo. Consultar `.specs/codebase/CONVENTIONS.md` antes de nomear qualquer módulo, classe ou arquivo novo.

## Gates de verificação

Adaptar ao stack do projeto. Exemplos de padrão:

```bash
# Testes unitários
[comando do runner do projeto — pytest / jest / cargo test / go test / etc.]

# Endpoint/serviço respondendo
curl -s http://localhost:[porta]/health

# Container saudável (se Docker)
docker ps --filter name=[nome-do-serviço] --format "{{.Status}}"

# Build sem erros
[comando de build do projeto]
```

## Execução paralela [P]

Tarefas marcadas como paralelas podem rodar simultaneamente. Exemplos típicos:
- Implementar endpoint API [P] + escrever testes [P]
- Criar modelo de dados [P] + criar migration [P]

Tarefas sequenciais (sem [P]) sempre em ordem de dependência.
