<<<<<<< HEAD
# FieldVision — Plataforma de Análise de Desempenho Físico

Projeto full stack funcional para análise de desempenho físico de atletas de futebol, com importação real de planilhas Excel/CSV, persistência em PostgreSQL, API própria e dashboard responsivo em React.

## Stack

- Frontend: React + TypeScript + Tailwind CSS + Recharts
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- Upload/importação: Multer + XLSX + csv-parser
- Arquitetura: Controllers, Services, Repositories, Routes, Middlewares

## Como rodar com Docker

```bash
docker compose up --build
```

Acesse:

- Frontend: http://localhost:5173
- API: http://localhost:3333/api/health
- PostgreSQL: localhost:5432

## Como rodar localmente sem Docker

### Banco

Crie um PostgreSQL local e configure a variável:

```env
DATABASE_URL="postgresql://atletatrack:atletatrack@localhost:5432/atletatrack?schema=public"
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Importação da planilha

Na tela **Importar**, envie um arquivo `.xlsx`, `.xls` ou `.csv` com as colunas oficiais.

Para facilitar testes locais e onboarding de novos desenvolvedores, este repositório inclui arquivos fictícios prontos para importação em:

- `samples/fieldvision_sample.xlsx`
- `samples/fieldvision_sample.csv`

Ambos usam o mesmo conjunto de colunas oficiais e podem ser enviados diretamente na tela **Importar** ou no endpoint `POST /api/import`.

Colunas oficiais:


- Athlete ID
- Athlete Position
- Athlete Groups
- Start Date
- Start Time
- Start Time (s)
- End Time (s)
- Week Start Date
- Month Start Date
- Segment Name
- Duration (mins)
- Session Load
- Workload
- Workload Volume
- Workload Intensity
- Distance (m)
- Metres per Minute (m)
- High Intensity Running (m)
- No. of High Intensity Events
- Sprint Distance (m)
- Raw Top Speed (kph)
- No. of Sprints
- Top Speed (kph)
- Avg Speed (kph)
- Accelerations
- Decelerations
- Percentage of Max Speed
- Percentage of Raw Max Speed KPH
- 90% of Max Speed Events
- 90% of Max Speed Distance (m)
- 90% of Max Speed Duration (secs)
- 90% of Raw Max Speed Events
- 90% of Raw Max Speed Distance (m)
- 90% of Raw Max Speed Duration (secs)

Colunas obrigatórias mínimas: `Athlete ID` e `Start Date`.

## Endpoints principais

- `POST /api/import` — importar Excel/CSV no campo `file`
- `GET /api/athletes` — listar atletas
- `GET /api/athletes/:id` — detalhes de atleta
- `GET /api/performances` — registros de desempenho com filtros
- `GET /api/dashboard` — indicadores agregados
- `GET /api/compare?ids=A,B` — comparação entre atletas
- `GET /api/alerts` — alertas ativos
- `POST /api/alerts/recalculate` — recalcular alertas

## Filtros aceitos

Os endpoints de dashboard e performances aceitam:

- `athleteId`
- `position`
- `group`
- `segment`
- `startDate`
- `endDate`

Exemplo:

```bash
GET /api/dashboard?position=Forward&startDate=2026-01-01&endDate=2026-03-31
```

## Lógica de classificação de perfil

O sistema classifica automaticamente cada atleta após a importação:

- **Explosivo**: alto número de sprints, alta velocidade máxima e alta distância de sprint.
- **Alta resistência**: alta distância total, duração alta e boa metragem por minuto.
- **Baixa intensidade**: baixa carga, baixa distância e poucos eventos de alta intensidade.
- **Alta carga de impacto**: muitas acelerações/desacelerações e workload alto.
- **Equilibrado**: quando não há extremos evidentes.

## Lógica de alerta de queda

Após a importação, o sistema compara o último registro do atleta com sua média histórica anterior. Se houver queda de 15% ou mais em métricas importantes, gera alerta:

- 15% a 19,99%: BAIXO
- 20% a 29,99%: MÉDIO
- 30% ou mais: ALTO

Métricas avaliadas:

- Distance
- Session Load
- Sprint Distance
- Top Speed
- Avg Speed
- Accelerations
- Decelerations

## Observação importante

O sistema não possui dados mockados no código. O dashboard só apresenta dados após a importação de uma planilha real.
=======
FieldVision — Plataforma de Análise de Desempenho Físico com IA
Projeto full stack focado na análise de desempenho físico de atletas de futebol de alto rendimento. A plataforma combina a ingestão robusta de dados via planilhas (Excel/CSV), persistência relacional e um motor de Inteligência Artificial dedicado (Microsserviço) para detecção de anomalias e clusterização de perfis, apresentados em um dashboard responsivo.

🚀 Arquitetura e Stack Tecnológico
O projeto adota uma arquitetura distribuída, separando as responsabilidades da plataforma web das rotinas de Machine Learning.

Frontend: React 18 + TypeScript + Tailwind CSS + Recharts

Backend (Core): Node.js + Express + TypeScript (Arquitetura em MVC/Services)

Banco de Dados & ORM: PostgreSQL 16 + Prisma ORM

Motor de IA (Microsserviço): Python + FastAPI + scikit-learn (K-Means e Isolation Forest)

Processamento de Dados: Multer + XLSX + csv-parser

⚙️ Como executar o ambiente completo
Para que a plataforma funcione integralmente, incluindo as predições de inteligência artificial, você precisará rodar a plataforma principal (via Docker) e o motor de IA em paralelo.

Passo 1: Iniciar o Sistema Principal (Node.js + React + Postgres)
Acesse a pasta principal do projeto (fieldvision_main) e levante os containers:

Bash
docker compose up -d --build
Acessos disponibilizados:

Frontend: http://localhost:5173

API (Healthcheck): http://localhost:3333/api/health

Banco de Dados: localhost:5432

Passo 2: Iniciar o Motor de IA (fv-categorizing)
O serviço de inteligência artificial deve estar ativo para processar a clusterização e as anomalias durante a importação de dados.

Abra um novo terminal e navegue até a pasta do microsserviço: cd fv-categorizing

Instale as dependências: pip install -r requirements.txt --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org

Inicie o servidor da API:

Bash
python -m uvicorn main:app --reload --port 8000
O motor de IA ficará disponível em http://localhost:8000 aguardando as requisições do Node.js.

🧠 Inteligência Artificial Explicável (Explainable AI)
O FieldVision utiliza o conceito de IA Explicável. O microsserviço em Python toma as decisões complexas, enquanto o Node.js atua como uma camada estatística que traduz essas decisões em insights claros para a comissão técnica.

1. Perfilamento Automático de Atletas (K-Means)
Logo após a importação de uma planilha, o sistema principal agrega as métricas de cada jogador e as envia para o endpoint /predict do motor de IA. O algoritmo K-Means agrupa o atleta em um de cinco clusters não-supervisionados:

Explosivo: Alto número de sprints e velocidade máxima.

Alta Resistência: Elevada distância total e volume de trabalho contínuo.

Baixa Intensidade: Baixa carga de trabalho e distância.

Alta Carga de Impacto: Elevado número de acelerações/desacelerações bruscas.

Equilibrado: Atuação consistente sem extremos evidentes.

2. Detecção de Queda de Desempenho (Isolation Forest)
Durante a importação de novas partidas, o backend em Node.js isola o histórico recente de cada jogador (médias de base) e envia junto com a partida atual para a rota /detect-anomaly do motor de IA.

A Decisão: O modelo Isolation Forest avalia os vetores e decide automaticamente se a sessão atual é uma anomalia (ponto fora da curva).

A Explicação: Caso a IA confirme a anomalia, o Node.js calcula a porcentagem exata da queda (ex: "Queda de 24% em relação à média") para categorizar a severidade do alerta (Baixo, Médio ou Alto) e apresentá-lo de forma digerível no dashboard.

📊 Importação de Dados e Endpoints
Na tela Importar, envie um arquivo .xlsx, .xls ou .csv. O projeto exige o cumprimento de colunas oficiais para o processamento padrão.

Arquivos de teste disponíveis no repositório:

samples/fieldvision_sample.xlsx

samples/fieldvision_sample.csv

Colunas obrigatórias mínimas: Athlete ID e Start Date.

Endpoints da API Principal (Node.js)
POST /api/import — Importa planilhas em batch via multipart/form-data.

GET /api/athletes — Lista de atletas.

GET /api/performances — Registros de desempenho (suporta filtros complexos).

GET /api/dashboard — Indicadores e KPIs agregados.

GET /api/compare?ids=A,B — Comparativo analítico entre perfis.

GET /api/alerts — Lista de alertas gerados pela IA.

Filtros Aceitos (Dashboard e Performances)
Os endpoints de consulta aceitam query params para granularidade analítica:
athleteId, position, group, segment, startDate, endDate.

Exemplo de uso:

Bash
GET /api/dashboard?position=Forward&startDate=2026-01-01&endDate=2026-03-31
Aviso: O sistema opera estritamente com dados reais e não injeta dados mockados no código. O dashboard e os gráficos permanecerão zerados até a primeira importação bem-sucedida de uma planilha pela comissão técnica.
>>>>>>> 1122f1733359823ff46d03f4d1558eb6640415ce
