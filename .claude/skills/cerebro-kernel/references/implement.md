# Implement — Execução com Commits Atômicos

## Princípio

Um commit = uma intenção. Nunca misturar feature + refactor + fix no mesmo commit.
Cada passo verificável antes de avançar ao próximo.

## Fluxo de execução

```
Para cada tarefa em tasks.md:
  1. Ler a tarefa + critérios de verificação
  2. Verificar dependências anteriores (gate anterior passou?)
  3. Implementar — mínimo necessário para o critério ser atendido
  4. Executar gate de verificação
  5. Se passou → commit atômico → marcar tarefa como concluída
  6. Se falhou → diagnosticar antes de continuar (não empilhar código quebrado)
```

## Convenção de commits

```
tipo: descrição concisa no imperativo

Tipos aceitos:
  feat     → nova funcionalidade
  fix      → correção de bug
  refactor → sem mudança de comportamento externo
  config   → configuração, variáveis de ambiente, Docker
  docs     → documentação, comentários
  test     → testes (sem alterar código de produção)
  chore    → tarefas de manutenção (deps, scripts)
  perf     → melhoria de performance

Exemplos:
  feat: adicionar [funcionalidade] para [contexto/usuário]
  fix: corrigir [problema] em [módulo] quando [condição]
  refactor: extrair [responsabilidade] de [origem] para [destino]
  config: ajustar [parâmetro] de [serviço] para [motivo]
  feat: implementar [componente] com [comportamento configurável]
  fix: tratar [erro] em [operação] durante [cenário]
  test: cobrir [caso de borda] em [módulo]
  perf: adicionar índice em [tabela/collection].[campo] para [consulta]
```

## Gates de verificação por contexto

Adaptar ao stack do projeto. Padrões comuns:

### API / Serviço web
```bash
# Health check
curl -s http://localhost:[porta]/health

# Endpoint específico com payload
curl -s -X POST http://localhost:[porta]/[recurso] \
  -H "Content-Type: application/json" \
  -d '[payload de exemplo]'

# Testes unitários
[runner do projeto] tests/[módulo] -v

# Testes com coverage
[runner do projeto] tests/ --coverage
```

### Banco de dados
```bash
# Verificar dado persistido corretamente
[cliente do BD] -e "[query de verificação]"

# Verificar índice/migration aplicado
[cliente do BD] -e "[query de schema/índice]"
```

### Docker / Infra
```bash
# Container rodando e saudável
docker ps --filter name=[nome-do-serviço] --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs sem erros críticos (últimos 50)
docker logs [nome-do-container] --tail 50 | grep -E "(ERROR|CRITICAL|Exception)"

# Rebuild e up limpo
docker-compose up --build -d && docker-compose logs -f [nome-do-serviço]

# Verificar variáveis de ambiente
docker exec [nome-do-container] env | grep -E "[VARS_RELEVANTES]"
```

### Integração externa
```bash
# Verificar conectividade com serviço externo
[comando de health/ping do serviço]

# Testar operação básica de leitura
[comando ou script mínimo de verificação]

# Testar operação básica de escrita (se aplicável)
[comando ou script mínimo de verificação]
```

## Regras de ouro

1. **Nunca commitar código que quebra gate.** Se o gate falhou, o commit não acontece.
2. **Nunca empilhar mais de 2 tarefas sem commitar.** Contexto acumula, rastreabilidade cai.
3. **Mensagem de commit como documentação.** `fix: corrigir bug` não diz nada. `fix: tratar timeout em [Módulo] quando [condição específica]` documenta.
4. **Código de produção e testes no mesmo commit.** Não existe "vou escrever os testes depois".
5. **Se revelar complexidade inesperada → PARAR.** Atualizar tasks.md, comunicar, depois continuar.

## Quando parar e reavaliar

Sinalizar ⚠️ e interromper execução se:
- Gate falhou 2 vezes e a causa não está clara
- A implementação está afetando mais arquivos que o previsto
- Uma decisão arquitetural não prevista no design aparece
- Tempo estimado dobrou — isso é informação, não acidente
