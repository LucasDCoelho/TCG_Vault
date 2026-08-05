# Safe-guard — Auditoria de risco de mudanças (commits ou trabalho em andamento)

Absorvido de uma skill separada (`safe-guard`) no fork total desta capacidade para dentro do cerebro-kernel. Protocolo preservado sem alteração de lógica.

Ao carregar este reference, aja como um revisor de código cético e prático. Seu trabalho **não** é elogiar nem reescrever o código — é olhar o que mudou e dizer, com franqueza, **onde isso pode quebrar**. Pense como quem vai dar plantão se isso subir pra produção hoje à noite.

O foco não é "o código está bonito?". É: **"se eu mexer aqui, o que para de funcionar? Que caso o autor esqueceu? O que acontece quando o usuário ou o backend faz algo fora do esperado?"**

## Passo 1 — Escolher o modo

Dois modos. Decida pelo que o usuário disse; só pergunte se estiver genuinamente ambíguo.

- **MODO AGORA** (alterações ainda não commitadas) — use quando o usuário falar em "agora", "atual", "o que eu mexi até agora", "antes de commitar", "o que tá aberto", "trabalho em andamento", ou um gatilho curto tipo *safe-guard agora*. É para revisar o que está na mesa **antes** de virar commit.
- **MODO COMMITS** (histórico) — padrão quando o usuário fala em "últimos commits", dá um número/intervalo, ou pede revisão "antes do deploy/merge/PR" sem indicar trabalho em andamento. Padrão: **últimos 10 commits**.

## Passo 2 — Coletar o que mudou

Não confie na memória — leia o diff real. Use o script empacotado (agora vive dentro do próprio cerebro-kernel), que já trata os casos chatos (repositório com menos de N commits, nomes de arquivo com espaço, arquivos binários/gigantes, merges e ruído gerado como lockfiles e `dist/`):

```bash
# MODO AGORA
bash .claude/skills/cerebro-kernel/scripts/collect.sh agora

# MODO COMMITS (N opcional, padrão 10; também aceita range, ex.: main..HEAD)
bash .claude/skills/cerebro-kernel/scripts/collect.sh commits 10
```

O script aborta sozinho se não for um repositório git. No **MODO AGORA**, se o `git status` voltar vazio (working tree limpo), **não invente nada para auditar**: diga que não há alterações pendentes e ofereça rodar o MODO COMMITS no lugar.

**Diffs grandes.** Se a coleta vier enorme (PR com muitos arquivos), não tente engolir tudo. Priorize os arquivos de maior risco — lógica de negócio, contratos de dados, auth, e o que outras partes consomem — audite esses a fundo, dê uma passada rápida no resto, e diga ao usuário no relatório: "o diff é grande; auditei a fundo os N arquivos mais críticos". Honestidade sobre cobertura vale mais que uma varredura rasa que finge ter visto tudo.

Se precisar inspecionar um arquivo isolado a fundo: `git show <hash> -- <caminho>` (MODO COMMITS) ou `git diff -- <caminho>` (MODO AGORA).

## Passo 3 — Mapear a superfície alterada

Para cada arquivo tocado, classifique **o que ele representa no produto**, não só o caminho. O usuário quer enxergar a tela/rota/fluxo afetado. Agrupe assim:

- **Telas / UI** — páginas, views, componentes de tela (ex.: `LoginScreen`, `app/dashboard/page.tsx`).
- **Rotas / endpoints** — rotas de API, controllers, handlers, definição de rotas do front.
- **Fluxos / lógica de negócio** — services, hooks, stores, use-cases, validações.
- **Dados / contratos** — models, schemas, tipos, migrations, DTOs, contratos de API.
- **Config / infra** — env, build, deploy, dependências (`package.json`, `requirements.txt`, CI).

Sempre que der, ligue o arquivo ao que o usuário vê: "esse arquivo é a tela de pagamento", "essa rota é o login". É isso que o usuário pediu.

## Passo 4 — Análise de risco (o coração do protocolo)

Para **cada** mudança relevante, passe por este checklist. Só reporte o que tiver fundamento real no diff — nada de risco genérico de enchimento.

**Regressão no fluxo atual**
- A mudança altera algo que outras partes consomem? (assinatura de função, formato de retorno, nome de prop, chave de objeto, rota)
- Algo que dependia do comportamento antigo quebra agora silenciosamente?
- Removeu/renomeou algo ainda referenciado em outro lugar? Confirme com `git grep <nome_antigo>` antes de afirmar.

**Bug provável introduzido**
- Lógica invertida, condição errada, off-by-one, `await` esquecido, estado não atualizado.
- Efeito colateral novo (chamada extra de API, re-render em loop, escrita em estado global).
- Mudança que funciona no caminho feliz mas ignora um ramo do código.

**Tratamento de erro e casos de borda faltando** (foco principal do protocolo)
- E se o **usuário** sair do roteiro? Campo vazio, clicar duas vezes, voltar no meio do fluxo, valor negativo, texto onde se espera número, sem permissão.
- E se o **backend** responder diferente? Erro 4xx/5xx, lista vazia, `null`/`undefined`, campo ausente, formato diferente, timeout, resposta lenta.
- Faltam estados de **loading / erro / vazio** na UI?
- Faltam validações de entrada, checagem de `null`/`undefined`, try/catch, fallback?
- Promessas sem `.catch`, `JSON.parse` sem proteção, acesso a `data.x.y` que pode não existir.

**O que está faltando**
- Mudou a lógica mas não atualizou (ou não criou) o teste do novo caminho?
- Mudou o contrato da API mas o outro lado (front ou back) não acompanhou?
- Faltou migration, variável de ambiente, atualização de tipo, ou doc de um breaking change?
- Mexeu em segurança/auth sem cobrir o caso de acesso indevido?

## Passo 5 — Entregar o relatório

Duas formas: salvo em arquivo **e** resumido na conversa.

### 5a — Salvar em arquivo

Grave o relatório em `docs/safe-guard/<YYYY-MM-DD>/<arquivo>.md` (data ISO — ordena sozinha por dia), relativo à raiz do repo **auditado** (não do cerebro-kernel). O nome depende do modo: **MODO COMMITS → `report.md`**; **MODO AGORA → `report-wip.md`**.

```bash
DIA=$(date +%F)                       # ex.: 2026-07-13 (ISO)
mkdir -p "docs/safe-guard/$DIA"
# MODO COMMITS → docs/safe-guard/$DIA/report.md
# MODO AGORA   → docs/safe-guard/$DIA/report-wip.md
```

Dois cuidados:
- **Não sobrescreva.** Se o arquivo do dia já existir, acrescente sufixo numérico (`report-2.md`, `report-wip-2.md`, …) para não perder a auditoria anterior.
- **Avise sobre o versionamento.** Esses arquivos ficam *dentro* do repo e podem ser commitados por acidente junto com a feature. Se `docs/safe-guard/` não estiver no `.gitignore`, mencione isso ao usuário e ofereça adicionar.

Sempre informe o caminho exato gravado.

### 5b — Formato do relatório

Use **sempre** este formato, no arquivo e no resumo. Responda no idioma do usuário (padrão: português). Seja direto. No título e no Resumo, ajuste o subtítulo conforme o modo: "dos últimos N commits" ou "das alterações atuais (não commitadas)".

```
# Safe-guard — Auditoria <dos últimos N commits | das alterações atuais (não commitadas)>

## Resumo
Severidade: 🟥 <n> · 🟨 <n> · 🟩 <n>
[2-3 linhas: o que foi mexido no geral e o nível de risco da leva como um todo.]

## Por superfície alterada

### 🟥 <tela/rota> | <commit> | <autor> — <alteração curta>
**O que mudou:** [descrição curta e concreta do diff]
**Risco:** [o que pode quebrar e por quê]
**Quebra quando:** [gatilho específico — "se o backend devolver lista vazia", "se o usuário clicar antes de carregar"]
**Falta:** [o que precisaria existir pra ficar seguro]

### 🟨 [próxima superfície] ...

### 🟩 [mudanças de baixo risco — pode agrupar várias, uma linha cada]
```

A linha de identificação é **`tela/rota | commit | autor — alteração`**:
- **tela/rota** — o nome legível da superfície (ex.: `Tela de Checkout`, `Rota POST /pedidos`), não só o caminho.
- **commit** — o hash curto no MODO COMMITS; no MODO AGORA, o estado (`staged`, `working tree`, `arquivo novo`).
- **autor** — `%an` do commit. No MODO AGORA, quem está mexendo agora (`git config user.name`) ou `não commitado`.
- **alteração** — resumo de uma linha do que mudou.

**Níveis de severidade:**
- 🟥 **Alto** — quebra provável de um fluxo real, ou bug que chega no usuário. Olhar antes de seguir.
- 🟨 **Médio** — falha em caso de borda/erro, tratamento ausente. Não quebra o caminho feliz, mas quebra com entrada/resposta inesperada.
- 🟩 **Baixo** — observação, melhoria, ou mudança segura. Citar rápido e seguir.

Ordene do mais grave para o menos grave. Se uma categoria não tiver risco real, diga isso explicitamente — "nenhum risco alto encontrado" é uma resposta válida e útil. Feche com uma linha de **veredito**: dá pra seguir/deployar como está, ou tem algo que olhar primeiro?

### 5c — Resumo na conversa

Depois de gravar, **não cole o relatório inteiro de novo**. Confirme o caminho salvo, mostre o placar de severidade, liste os achados 🟥 e 🟨 em uma linha cada, e dê o veredito. Quem quiser o detalhe abre o arquivo.

## Princípios

- **Leia o diff de verdade.** Todo apontamento tem que estar ancorado no que você viu, com o commit/arquivo citado. Sem palpite genérico.
- **Não invente risco pra parecer útil.** Se a leva está limpa, diga que está limpa. Confiança vale mais que volume.
- **Pense no caminho infeliz.** O caminho feliz quase sempre funciona — o valor deste protocolo é prever o que acontece quando o usuário ou o backend sai do roteiro.
- **Aponte a tela/fluxo, não só o arquivo.** O usuário quer saber "o que isso afeta no produto".
- **Não reescreva o código sem pedir.** O entregável é o diagnóstico. Se o usuário quiser a correção depois, aí sim ajude a corrigir.
