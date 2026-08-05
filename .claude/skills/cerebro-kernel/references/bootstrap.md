# Bootstrap — Iniciar a Skill do Zero

## O problema que este documento resolve

A skill assume que `.specs/` existe. Em projetos reais, não existe.
Este documento cobre os três cenários de entrada possíveis e o que fazer em cada um.

---

## Cenário A — Projeto novo, ainda sem código

Tudo será criado do zero. Sequência:

```
1. initialize project  → cria .specs/project/ com PROJECT.md + ROADMAP.md
2. specify feature     → primeira feature já documentada
3. implement           → primeira entrega
```

Não há brownfield. Pular map codebase.

**Como executar o initialize project:**

```
Perguntar ao operador (uma pergunta por vez):
1. "Qual o nome do sistema?" → preencher PROJECT.md
2. "Qual o problema que ele resolve em uma frase?" → objetivo central
3. "Quem usa e o que espera como resultado?" → stakeholders + critério de sucesso
4. "Qual a primeira entrega que precisa existir para o sistema ser útil?" → primeira entrada no ROADMAP.md
```

Criar `.specs/project/PROJECT.md` e `.specs/project/ROADMAP.md` com as respostas.
Criar `.specs/project/STATE.md` vazio com estrutura base (ver `state-management.md`).

---

## Cenário B — Projeto existente, sem nenhuma documentação

O caso mais comum. Código rodando em produção, sem README útil, sem docs.

**Não perguntar nada antes de varrer.** Primeiro explorar, depois confirmar.

### Passo 1 — Varredura inicial (executar antes de qualquer conversa)

```bash
# Estrutura geral (adaptar extensão ao stack)
find . -maxdepth 3 -type f \( -name "*.py" -o -name "*.ts" -o -name "*.go" -o -name "*.java" -o -name "*.rs" \) | head -40

# Entry points comuns (usar o que existir)
cat main.py 2>/dev/null || cat app/main.py 2>/dev/null || cat src/index.ts 2>/dev/null || cat main.go 2>/dev/null
cat docker-compose.yml 2>/dev/null
cat Makefile 2>/dev/null | head -30

# Dependências (usar o que existir)
cat requirements.txt 2>/dev/null
cat package.json 2>/dev/null
cat go.mod 2>/dev/null
cat Cargo.toml 2>/dev/null
cat pom.xml 2>/dev/null | head -50

# Testes existentes
find . -path "*/test*" -type f | head -20
```

### Passo 2 — Gerar os 7 docs brownfield

Paralelizar (ver `brownfield-mapping.md`):
- Agente A → STACK.md + STRUCTURE.md
- Agente B → ARCHITECTURE.md + INTEGRATIONS.md
- Agente C → CONVENTIONS.md + TESTING.md + CONCERNS.md

### Passo 3 — Confirmar com operador antes de fechar

Após gerar os 7 docs, apresentar um resumo de 5 linhas e perguntar:

```
"Mapeei o sistema. Resumo:
- Stack: [X]
- Módulos principais: [Y]
- Risco crítico identificado: [Z]
Isso reflete o que você conhece? Alguma correção antes de fechar o mapeamento?"
```

Incorporar correções. Só então criar PROJECT.md e STATE.md inicial.

### Passo 4 — Criar PROJECT.md a partir do que foi encontrado

Não perguntar o que o código já responde. Perguntar apenas o que o código não revela:
- Qual o contexto de negócio por trás do sistema?
- Quais são as restrições externas (regulatórias, contratuais, prazos)?
- Quem são os stakeholders que aprovam entregas?

---

## Cenário C — Projeto existente, com documentação parcial

README existe mas está desatualizado. Docs existem mas estão incompletos.

**Regra:** nunca confiar em documentação sem verificar contra o código.

```
1. Ler README e docs existentes
2. Varrer o código para confirmar o que está escrito
3. Sinalizar contradições: "O README diz X, mas o código faz Y"
4. Gerar apenas os docs brownfield que estão ausentes ou incorretos
5. Incorporar o que já existe e está correto
```

Não reescrever documentação que está correta. Só corrigir e preencher lacunas.

---

## O que fazer quando o código está caótico

Sem padrão de nomenclatura, sem separação de responsabilidades, sem testes.

**Não tentar organizar antes de mapear.** Primeiro registrar o que existe, depois identificar o que precisa mudar.

Em `CONCERNS.md`, sinalizar com severidade Alta tudo que impede trabalho seguro:

```markdown
| Área | Risco | Severidade |
|------|-------|------------|
| Geral | Sem separação de responsabilidades — lógica de negócio misturada com I/O | Alta |
| Geral | Sem testes — qualquer mudança é risco cego | Alta |
| Config | Credenciais hardcoded no código | Alta |
```

Depois, apresentar ao operador e perguntar qual risco atacar primeiro antes de começar qualquer feature.

---

## Checklist de bootstrap completo

```
[ ] .specs/project/PROJECT.md criado e confirmado pelo operador
[ ] .specs/project/ROADMAP.md com pelo menos uma entrada
[ ] .specs/project/STATE.md com estrutura base (sem conteúdo falso)
[ ] .specs/codebase/ com os 7 docs brownfield (Cenário B/C)
[ ] Operador confirmou que o mapeamento reflete a realidade
[ ] CONCERNS.md com riscos sinalizados e severidade definida
[ ] Primeira feature identificada e priorizada
```

Só avançar para specify/implement depois que o checklist estiver completo.
Bootstrap incompleto = base podre para tudo que vem depois.
