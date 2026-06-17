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
