# Brownfield Mapping — Mapeamento de Codebase Existente

## Quando usar
Antes de implementar qualquer feature em projeto já existente. Sem mapeamento, não há como garantir que a implementação segue os padrões do sistema.

## Os 7 documentos

### STACK.md
```markdown
# Stack Tecnológica

## Linguagens
- [Linguagem principal] [versão exata]
- [Linguagem secundária] [versão] — [onde é usada, se aplicável]

## Frameworks e bibliotecas principais
- [Framework principal] [versão] — [função no sistema]
- [Framework secundário] [versão] — [função no sistema, se aplicável]

## Bancos de dados
- [BD principal] [versão] — [coleções/tabelas/usos principais]
- [BD secundário] [versão] — [uso específico, se aplicável]

## Infra e plataforma
- [Cloud provider / on-premise]: [serviços em uso e suas funções]
- [Containerização / orquestração, ex: Docker, Kubernetes]
- [Outros serviços de infra relevantes]

## Ferramentas de build / empacotamento
- [Gerenciador de pacotes, ex: npm, pip, cargo, maven]
- [Build tool, se aplicável]
- [Outros, ex: webpack, vite, gradle]

## Dependências principais
[Copiar de package.json, requirements.txt, Cargo.toml, pom.xml, go.mod etc. — apenas as relevantes]
```

### ARCHITECTURE.md
```markdown
# Arquitetura do Sistema

## Visão geral
[Diagrama textual ou descrição dos módulos principais]

## Módulos / camadas
[Listar os módulos ou camadas do sistema e o que cada um faz]

## Fluxo de dados
[Como um evento/dado principal percorre o sistema — do input ao output]

## Pontos de integração externos
[APIs externas, sistemas de terceiros, serviços cloud]
```

### CONVENTIONS.md
```markdown
# Convenções de Código

## Nomenclatura
[Prefixos, sufixos, padrões de nomes usados no projeto]
[Ex: prefixos por domínio, sufixos por tipo (Service, Controller, Repository)]

## Estrutura de pastas
[Como o projeto está organizado]

## Padrões de API
[Formato de resposta, autenticação, versionamento]

## Padrões de persistência
[Nomes de tabelas/collections, campos obrigatórios, índices relevantes]

## Git
[Branch strategy, convenção de commits]
```

### STRUCTURE.md
Árvore de diretórios relevante com anotações sobre cada parte.

### TESTING.md
```markdown
# Testes

## O que existe
- [ ] Unitários
- [ ] Integração
- [ ] End-to-end

## Comando de execução
[comando para rodar os testes]

## Coverage atual
[se conhecido]

## O que não tem cobertura
[áreas críticas sem teste — risco]
```

### INTEGRATIONS.md
```markdown
# Integrações Externas

## [Nome da integração principal]
- Protocolo / SDK: [como se comunica]
- Autenticação: [método]
- Comportamento esperado quando indisponível: [o que acontece hoje]

## [Nome da integração secundária]
- [idem]

## Outros serviços / infra
[Filas, storage, serviços cloud, VPNs, redes internas — o que existir]
```

### CONCERNS.md
```markdown
# Preocupações e Dívida Técnica

## Riscos ativos
| Área | Risco | Severidade | Observação |
|------|-------|------------|------------|
| [módulo/área] | [descrição do risco] | Alta/Média/Baixa | |

## Dívida técnica conhecida
[O que está "por enquanto assim" e vai cobrar fatura]

## Áreas frágeis
[Código que ninguém quer mexer e por quê]
```

## Como executar o mapeamento

**Ambiente:** paralelizar sempre — 3 agentes simultâneos, cada um com contexto mínimo:
- Agente A → `STACK.md` + `STRUCTURE.md`
- Agente B → `ARCHITECTURE.md` + `INTEGRATIONS.md`
- Agente C → `CONVENTIONS.md` + `TESTING.md` + `CONCERNS.md`

**Sequência por agente:**
1. Varrer estrutura de arquivos e entry points (`main.*`, `index.*`, `app.*`, `docker-compose.yml`, `package.json`, `Makefile` etc.)
2. Identificar padrões reais em uso — não assumir, ler o código
3. Documentar o que não está documentado em lugar nenhum
4. Sinalizar ⚠️ qualquer risco identificado

---

## Exemplos de saída preenchida

Os templates acima são estrutura. Abaixo, como ficam preenchidos — para que estagiários e analistas tenham referência concreta.

### Exemplo: CONVENTIONS.md preenchido

```markdown
# Convenções de Código

## Nomenclatura de módulos
- Prefixo `Cerebro` → processamento central e regras de negócio
  - Ex: CerebroAuditService, CerebroReinfracaoChecker, CerebroValidacaoPlaca
- Prefixo `Vision` → visão computacional, OCR, detecção de objetos
  - Ex: VisionPlateDetector, VisionOCRService, VisionSpeedEstimator
- Prefixo `Neuro` → rede, câmeras IP, RTSP, conectividade
  - Ex: NeuroStreamManager, NeuroHealthMonitor, NeuroCameraRegistry

## Estrutura de pastas
app/
├── cerebro/     # regras de negócio
├── vision/      # visão computacional
├── neuro/       # rede e câmeras
├── api/         # routers FastAPI
├── db/          # conexões MongoDB e PostgreSQL
└── config/      # variáveis de ambiente

## Padrões de API
- Respostas sempre em JSON com campos: { data, error, timestamp }
- Autenticação via Bearer token no header Authorization
- Versionamento no path: /v1/autuacoes, /v1/cameras

## Padrões de MongoDB
- Collection principal: autuacoes (snake_case, plural)
- Campos obrigatórios: placa, camera_id, timestamp, frame_path
- Índices: { placa: 1, timestamp: -1 } — consultas por placa + período

## Git
- Branch: feature/CK-NNN-slug, fix/CK-NNN-slug
- Commits: tipo: descrição no imperativo (ex: feat: adicionar detecção de reinfração)
- Merge via PR — nunca direto na main
```

### Exemplo: CONCERNS.md preenchido

```markdown
# Preocupações e Dívida Técnica

## Riscos ativos
| Área | Risco | Severidade | Observação |
|------|-------|------------|------------|
| RTSP | Sem retry automático quando câmera cai | Alta | NeuroStreamManager não tem backoff |
| OCR | Threshold de confiança hardcoded (0.75) | Média | Deveria ser configurável por câmera |
| MongoDB | Sem índice em camera_id isolado | Média | Queries por câmera fazem full scan |
| Lambda | Timeout de 30s estourado em pico de tráfego | Alta | Ocorre em horário de rush |

## Dívida técnica conhecida
- CerebroValidacaoPlaca mistura validação e persistência no mesmo método
- Credenciais RTSP em variável de ambiente não rotacionadas desde jan/2024
- Testes de integração cobrem apenas happy path — sem simulação de câmera offline

## Áreas frágeis
- `neuro/stream_manager.py` — ninguém quer mexer, lógica de reconexão não documentada
- Pipeline de aggregation em `cerebro/reinfraction_checker.py` — funciona mas sem índice adequado degrada sob carga
```

### Exemplo: STRUCTURE.md preenchido

```
cerebro-fiscalizacao/
├── app/
│   ├── cerebro/
│   │   ├── audit_service.py         # registro de autuações + S3
│   │   ├── reinfraction_checker.py  # lógica de reinfração (janela 24h)
│   │   └── validacao_placa.py       # validação formato Mercosul + antigo
│   ├── vision/
│   │   ├── plate_detector.py        # detecção via OpenCV
│   │   ├── ocr_service.py           # OCR com threshold configurável
│   │   └── speed_estimator.py       # estimativa por câmera fixa (WIP)
│   ├── neuro/
│   │   ├── stream_manager.py        # ⚠️ área frágil — ver CONCERNS.md
│   │   ├── health_monitor.py        # status das câmeras
│   │   └── camera_registry.py       # cadastro e configuração de câmeras
│   ├── api/
│   │   ├── routers/
│   │   │   ├── autuacoes.py
│   │   │   └── cameras.py
│   │   └── main.py                  # entry point FastAPI
│   └── db/
│       ├── mongo.py                 # conexão + helpers de aggregation
│       └── postgres.py              # conexão + modelos SQLAlchemy
├── tests/
│   ├── test_vision.py
│   ├── test_cerebro.py
│   └── integration/                 # ⚠️ apenas happy path coberto
├── docker-compose.yml
├── requirements.txt
└── .specs/                          # documentação viva do projeto
```
