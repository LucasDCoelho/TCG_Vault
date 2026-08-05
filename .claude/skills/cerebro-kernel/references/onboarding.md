# Onboarding — Modo de Entrada para a Equipe

## Para quem é este documento

Estagiários, analistas, e qualquer pessoa da equipe que vai usar o Cerebro Kernel sem ter participado da criação. Leia isso antes de qualquer outra coisa.

---

## O que é o Cerebro Kernel

É o sistema que a empresa usa para tomar decisões técnicas e executar trabalho de forma estruturada. Ele tem duas funções:

1. **Decidir** — o que fazer agora, por quê, e em que ordem (Kernel)
2. **Executar** — como estruturar, documentar e entregar (Spec-Driven)

Você não precisa entender tudo de uma vez. Comece pelo seu papel.

---

## Papéis e o que cada um usa

### Estagiário / Desenvolvedor júnior

O que você vai usar no dia a dia:

- **Quick fix** — para bugs e ajustes pequenos
- **Tasks** — para executar tarefas que alguém já especificou
- **Implement** — para escrever código seguindo o que está no tasks.md

O que você **não** faz sem supervisão:
- Criar spec.md do zero
- Tomar decisões arquiteturais
- Fechar design.md

**Fluxo típico do seu trabalho:**
```
1. Receber tarefa → ler tasks.md da feature
2. Verificar dependências (a tarefa anterior foi concluída?)
3. Implementar seguindo as convenções do projeto (ver `.specs/codebase/CONVENTIONS.md`)
4. Executar o gate de verificação descrito na tarefa
5. Fazer commit atômico com mensagem no padrão
6. Marcar tarefa como concluída no tasks.md
```

### Analista / Desenvolvedor pleno

Além do que o estagiário faz, você também:

- Escreve spec.md para features médias
- Atualiza STATE.md ao final de cada sessão
- Identifica e registra riscos no CONCERNS.md
- Conduz UAT funcional (ver `validate.md`)

**Regra importante:** se encontrar algo no código que contradiz o que está nos docs de codebase, corrigir o doc — não ignorar.

### Líder técnico (operador principal)

Tudo acima, mais:
- Decide arquitetura (design.md)
- Aprova specs antes de implementar
- Mantém ROADMAP.md e PROJECT.md atualizados
- Revisa STATE.md após afastamentos
- É o ponto de escalação quando alguém trava

---

## Como começar uma sessão de trabalho

**Sempre, antes de qualquer coisa:**

```
1. Abrir .specs/project/STATE.md
2. Ler "Sessão atual" — o que estava em progresso?
3. Ler "Bloqueios ativos" — algum bloqueia o que você vai fazer?
4. Confirmar com o líder se o STATE.md reflete a realidade
```

Se o STATE.md não foi atualizado recentemente (ver data no topo), **não assumir que está correto**. Perguntar antes de continuar.

---

## Convenções que você precisa conhecer antes de escrever código

### Nomenclatura de módulos

Consultar `.specs/codebase/CONVENTIONS.md` antes de criar qualquer arquivo, classe ou módulo novo. As convenções variam por projeto — não assumir padrões sem verificar.

**Se você está criando algo novo e não sabe onde encaixar → perguntar antes de criar.**

### Commits

```
tipo: descrição no imperativo, conciso

feat: adicionar [o quê] para [por quê / onde]
fix: corrigir [problema] em [onde]
test: cobrir [cenário] em [módulo]
refactor: extrair [o quê] de [onde]
```

Nunca: `fix: correção`, `feat: nova feature`, `update: atualização`. Mensagem sem contexto não serve para nada.

### Onde as coisas ficam

```
.specs/project/STATE.md      ← leia sempre ao começar
.specs/project/ROADMAP.md    ← o que está planejado
.specs/codebase/             ← mapa do sistema (convenções, arquitetura, riscos)
.specs/features/[nome]/      ← spec + design + tasks da feature que você está trabalhando
.specs/quick/                ← tarefas pequenas e bug fixes
```

---

## Sinais de que você precisa escalar para o líder

Não tente resolver sozinho quando:

- O gate de verificação falhou duas vezes e a causa não está clara
- A implementação está tocando mais arquivos do que o tasks.md previa
- Você encontrou algo no código que contradiz o spec
- A tarefa depende de algo que não foi entregue ainda e não tem prazo
- Você está prestes a tomar uma decisão que afeta mais de um módulo

**Escalar não é fraqueza. Não escalar e quebrar produção é problema.**

---

## Perguntas frequentes

**"Posso criar um arquivo fora da estrutura de pastas do projeto?"**
Sim, mas justificar no commit e avisar o líder. Pode ser sinal de que falta uma camada ou que a organização precisa ser revisada.

**"O tasks.md está desatualizado / errado. O que faço?"**
Não implementar com base em tasks.md incorreto. Corrigir o tasks.md primeiro (com o líder se necessário), depois implementar.

**"Não entendi o requisito no spec.md. O que faço?"**
Abrir o context.md da feature — decisões sobre áreas cinzas ficam lá. Se ainda não estiver claro, perguntar ao líder antes de implementar.

**"Posso commitar sem passar no gate?"**
Não. Gate falhou = commit não acontece. Sem exceção.

**"Como sei se minha tarefa é paralela ou sequencial?"**
Tasks marcadas com `[P]` são paralelas. As sem marcação seguem a ordem numérica. Se tiver dúvida, perguntar — executar tarefa fora de ordem pode quebrar outra.
