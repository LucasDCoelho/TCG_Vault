# Validate — Verificação e UAT

## Quando usar

- Ao concluir uma feature (Large ou Complex)
- Antes de merge para branch principal
- Antes de deploy em ambiente de homologação ou produção
- Quando um bug foi corrigido e precisa de regressão

Para quick fixes → gate do `quick-mode.md` é suficiente.

---

## Tipos de verificação

### 1. Gate técnico (automático)
Executar antes de qualquer UAT. Se falhar, não avançar.

```bash
# Testes unitários
[comando do runner do projeto — pytest / jest / cargo test / go test / etc.]

# Testes de integração (se existirem)
[idem, apontando para pasta de integração]

# Serviço respondendo
curl -s http://localhost:[porta]/health

# Sem erros críticos nos logs
[comando de log do projeto] | grep -c "ERROR\|CRITICAL\|Exception"
# Esperado: 0
```

### 2. UAT funcional (interativo)
Percorrer os critérios de aceite do spec.md com o usuário/stakeholder.

Formato de condução:
```
Para cada critério R0X:
  1. Descrever o cenário a ser testado
  2. Executar (mostrar ao usuário quando possível)
  3. Registrar: Passou / Falhou / Parcial
  4. Se falhou → abrir issue antes de continuar
```

### 3. Verificação de casos de borda (domínio do projeto)

Sempre testar os cenários críticos do domínio, independente da feature. Derivar da lista de riscos em `.specs/codebase/CONCERNS.md`.

Exemplos de estrutura — adaptar ao domínio real:

| Cenário | O que verificar |
|---------|----------------|
| [serviço externo indisponível] | Sistema não trava, log correto, comportamento de fallback |
| [dado inválido / fora do esperado] | Rejeitado ou tratado corretamente, sem efeito colateral |
| [operação concorrente / alta carga] | Sem race condition, sem perda de dados |
| [timeout de integração] | Fallback correto, sem duplicação de efeito |

### 4. Regressão
Verificar que nada do que existia foi quebrado:

```bash
# Rodar suite completa de testes
[comando do runner do projeto]

# Verificar endpoints existentes ainda respondem
[script de smoke test, se existir]

# Verificar integridade dos dados principais
[consulta ou script adequado ao banco/serviço do projeto]
```

---

## Relatório de validação

Ao final de cada ciclo de validação, registrar:

```markdown
## Relatório de Validação — [Nome da Feature]

**Data:** [data]
**Ambiente:** [dev / homologação / produção]
**Executado por:** [quem validou]

### Critérios de aceite

| ID | Critério | Status | Observação |
|----|----------|--------|------------|
| R01 | [descrição] | ✅ Passou / ❌ Falhou / ⚠️ Parcial | |
| R02 | [descrição] | ✅ / ❌ / ⚠️ | |

### Casos de borda testados

| Cenário | Status | Observação |
|---------|--------|------------|
| [cenário de borda 1] | ✅ / ❌ | |
| [cenário de borda 2] | ✅ / ❌ | |
| [cenário de borda 3] | ✅ / ❌ | |

### Issues abertas

| ID | Descrição | Severidade | Bloqueante? |
|----|-----------|------------|-------------|
| #XX | [descrição] | Alta / Média / Baixa | S/N |

### Decisão

[ ] Aprovado para merge / deploy
[ ] Aprovado com ressalvas (listar)
[ ] Reprovado — issues bloqueantes (listar)

**Próxima ação:** [o que fazer agora]
```

---

## Critérios de aprovação por ambiente

### Dev → Homologação
- [ ] Gate técnico: 0 erros
- [ ] Critérios de aceite: todos os Must aprovados
- [ ] Sem issues bloqueantes abertas

### Homologação → Produção
- [ ] UAT com stakeholder concluído e assinado
- [ ] Casos de borda do domínio testados
- [ ] Regressão sem falhas
- [ ] Plano de rollback documentado no design.md
- [ ] STATE.md atualizado com decisões desta feature

---

## Critérios de severidade de issues

| Severidade | Definição | Ação |
|------------|-----------|------|
| **Alta** | Dado perdido, comportamento incorreto em fluxo crítico, sistema inoperante | Bloqueia deploy. Corrigir antes. |
| **Média** | Comportamento incorreto em caso de borda não crítico | Pode ir com ressalva + issue aberta |
| **Baixa** | UX, performance não crítica, melhoria futura | Registrar no STATE.md como deferred |

---

## Checklist pré-produção (ISO 9001)

Antes de qualquer deploy em produção:

- [ ] Testes aprovados (gate técnico)
- [ ] UAT aprovado por responsável técnico
- [ ] Registro de mudança criado (data, responsável, escopo)
- [ ] Plano de rollback documentado e testado
- [ ] Notificação enviada a stakeholders impactados
- [ ] Janela de monitoramento definida pós-deploy (mínimo 30 min)
