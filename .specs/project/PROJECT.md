# RabbitLab — TCG Vault

## Visão

Site que permite a um colecionador fotografar uma carta de TCG (qualquer jogo),
ter a carta reconhecida automaticamente e guardá-la em um cofre/caixa
colecionável digital vinculada à sua conta.

## Problema real

Colecionadores não têm um lugar simples e visual para registrar e organizar
suas cartas sem digitar dados manualmente. O registro manual é tedioso e
erro-prone; guardar a foto sozinha não gera metadados úteis (nome, coleção,
raridade, valor).

## Objetivo central

"Transformar uma foto de carta de TCG em um item organizado dentro do cofre
pessoal do colecionador, com o mínimo de digitação manual."

## Stakeholders e critério de sucesso

- **Colecionador (usuário final):** consegue escanear uma carta com a foto do
  celular e vê-la salva no cofre com dados corretos. Sucesso = foto → item no
  cofre em < 30s.
- **RabbitLab (empresa):** lançar MVP no mercado para validar demanda e
  coletar feedback. Sucesso = MVP utilizável e demonstrável.

## Stack (decisão inicial)

| Camada | Escolha | Por quê |
|--------|---------|---------|
| Frontend | Angular | Decisão do operador |
| Backend | Python + FastAPI | Mais simples que Java para MVP |
| Banco | SQLite | Zero config, migra para Postgres depois |
| Auth | Google OAuth2 | Decisão do operador |
| OCR | API externa (Google Vision) + fallback Tesseract | Decisão do operador |
| Base de cartas | Scryfall API (MTG) | Gratuita, sem chave, rica em metadados |

## Restrições

- MVP sem cartão de crédito do usuário.
- Sem dependência de infra paga para rodar localmente (exceto Google OAuth e
  OCR, que exigem credenciais — com modo dev sem credenciais).
