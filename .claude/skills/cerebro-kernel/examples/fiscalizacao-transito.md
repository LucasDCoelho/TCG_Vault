# Exemplo de Referência — Sistema de Fiscalização de Trânsito

Práticas e padrões extraídos de um sistema real de fiscalização inteligente.
Use como base se estiver construindo algo estruturalmente similar: sistema com múltiplas fontes de entrada em tempo real, processamento em camadas (captura → análise → regra de negócio → persistência), e integrações com câmeras, armazenamento cloud e serviços de processamento assíncrono.

---

## Arquitetura de módulos por domínio

Divisão em três prefixos, cada um com responsabilidade exclusiva:

| Prefixo | Domínio | Exemplos |
|---------|---------|---------|
| `Cerebro*` | Processamento central, regras de negócio, orquestração | `CerebroAuditService`, `CerebroReinfracaoChecker`, `CerebroValidacaoPlaca` |
| `Vision*` | Visão computacional, OCR, detecção, estimativa | `VisionPlateDetector`, `VisionOCRService`, `VisionSpeedEstimator` |
| `Neuro*` | Rede, câmeras, conectividade, saúde de stream | `NeuroStreamManager`, `NeuroHealthMonitor`, `NeuroCameraRegistry` |

**Por que funciona:** cada prefixo mapeia para uma camada técnica com fronteira clara. Nunca misturar — `Neuro*` não processa negócio, `Cerebro*` não fala com câmera.

---

## Camadas do sistema

```
[Câmeras IP / RTSP]
        ↓
[Neuro* — captura e gestão de streams]
        ↓
[Vision* — processamento de imagem e OCR]
        ↓
[Cerebro* — regras de negócio e auditoria]
        ↓
[API — exposição dos dados]
        ↓
[Persistência — BD + object storage]
        ↓
[Processamento assíncrono — fila ou serverless]
```

---

## Estrutura de pastas

```
app/
├── cerebro/     # regras de negócio
├── vision/      # visão computacional
├── neuro/       # rede e câmeras
├── api/         # routers e controllers
├── db/          # conexões com bancos
└── config/      # variáveis de ambiente
```

---

## Convenções de código

### Padrões de API
- Respostas em JSON com campos: `{ data, error, timestamp }`
- Autenticação via Bearer token no header `Authorization`
- Versionamento no path: `/v1/autuacoes`, `/v1/cameras`

### Padrões de persistência (BD orientado a documento)
- Collection principal: `autuacoes` (snake_case, plural)
- Campos obrigatórios: `placa`, `camera_id`, `timestamp`, `frame_path`
- Índices: `{ placa: 1, timestamp: -1 }` — consultas por placa + período

### Git
- Branch: `feature/CK-NNN-slug`, `fix/CK-NNN-slug`
- Commits no imperativo: `feat: adicionar detecção de reinfração`
- Merge via PR — nunca direto na main

---

## Gates de verificação

### Endpoint da API
```bash
curl -s http://localhost:[porta]/health

curl -s -X POST http://localhost:[porta]/autuacoes \
  -H "Content-Type: application/json" \
  -d '{"placa": "ABC1D23", "camera_id": "CAM_001"}'
```

### BD orientado a documento (MongoDB)
```
# Verificar aggregation
db.autuacoes.aggregate([
  { $match: { placa: "ABC1D23" } },
  { $sort: { timestamp: -1 } },
  { $limit: 3 }
])

# Verificar índice aplicado
db.autuacoes.getIndexes()
```

### Container
```bash
docker ps --filter name=[serviço] --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs [container] --tail 50 | grep -E "(ERROR|CRITICAL|Exception)"
docker-compose up --build -d && docker-compose logs -f [serviço]
docker exec [container] env | grep -E "(MONGO|AWS|RTSP|API)"
```

### Stream de câmera (RTSP)
```
# Verificar conectividade
rtsp://[user]:[pass]@[ip]:[porta]/stream

# Testar leitura de frame
cap = VideoCapture(url)
isOpened() → True
read() → (True, frame)

# Testar reconexão
mgr = NeuroStreamManager('CAM_001')
mgr.health_check()
```

### Object storage (S3 ou similar)
```bash
# Verificar arquivo salvo
aws s3 ls s3://[bucket]/[path]/ --recursive | tail -5
```

### Processamento assíncrono (Lambda ou similar)
```bash
aws lambda invoke \
  --function-name [NomeDaFuncao] \
  --payload '{"camera_id": "CAM_001", "placa": "ABC1D23"}' \
  response.json && cat response.json
```

---

## Commits típicos do domínio

```
feat: adicionar detecção de reinfração por placa em janela de 24h
fix: corrigir reconnect de stream quando câmera retorna após timeout
refactor: extrair CerebroAuditService de AutuacaoController
config: aumentar worker timeout para câmeras com latência alta
feat: implementar VisionOCRService com threshold configurável por ambiente
fix: tratar KeyError em aggregation pipeline de autuações por período
test: cobrir casos de placa ilegível no VisionPlateDetector
perf: adicionar índice em autuacoes.placa + autuacoes.timestamp
```

---

## Casos de borda do domínio

Sempre testar antes de qualquer deploy:

| Cenário | O que verificar |
|---------|----------------|
| Câmera offline durante captura | Sistema não trava, log correto, reconexão automática |
| Placa ilegível / OCR baixa confiança | Marcado para revisão manual, não autuado automaticamente |
| Reinfração dentro da janela de tempo | Detectada corretamente, referência à autuação anterior |
| Placa com formato não padrão | Ambos os formatos reconhecidos (ex: Mercosul vs. antigo) |
| Múltiplas câmeras ao mesmo tempo | Sem race condition, sem perda de frames |
| Volume alto de eventos (stress) | Pipeline de aggregation não degrada |
| Object storage indisponível | Frame não perdido, retry funciona |
| Processamento assíncrono com timeout | Fallback correto, sem duplicação de evento |

---

## Áreas cinzas comuns neste tipo de sistema

Ambiguidades recorrentes que precisam ser resolvidas no `context.md` antes de implementar:

- **Threshold de confiança do OCR** — valor fixo ou configurável por câmera? Quem ajusta?
- **Janela de reinfração** — 24h corridas ou por período de fiscalização? Fuso horário importa?
- **Câmera offline** — silent fail ou alerta imediato? Quem recebe o alerta?
- **Placa ilegível** — descartado silenciosamente ou vai para fila de revisão manual?
- **Ordem de processamento** — FIFO por câmera ou global? Prioridade em horário de pico?
- **Múltiplos frames da mesma placa** — deduplicar como? Janela de tempo mínima entre registros?

---

## Dívida técnica recorrente

Padrões de dívida que aparecem com frequência neste tipo de sistema:

| Área | Problema típico | Severidade |
|------|----------------|------------|
| Stream manager | Sem retry automático com backoff quando câmera cai | Alta |
| OCR | Threshold de confiança hardcoded — não configurável por câmera | Média |
| BD | Sem índice em `camera_id` isolado — full scan em queries por câmera | Média |
| Processamento assíncrono | Timeout estourado em pico de tráfego sem fallback adequado | Alta |
| Credenciais | Credenciais de stream em variável de ambiente sem rotação | Alta |
| Testes | Integração cobre apenas happy path — sem simulação de câmera offline | Média |
| Módulo central | Validação e persistência misturadas no mesmo método | Baixa |

---

## Áreas frágeis típicas

- **Stream manager** — lógica de reconexão tende a crescer sem documentação, ninguém quer mexer
- **Pipeline de aggregation** — funciona, mas sem índice adequado degrada sob carga e é difícil de debugar
- **Threshold de OCR** — mudança de valor afeta volume de autuações diretamente, mexer com cuidado
