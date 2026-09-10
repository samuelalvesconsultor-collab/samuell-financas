# Samuell Finanças — Design Spec

**Data:** 2026-09-09
**Status:** Aprovado
**Escopo:** MVP — gestão financeira pessoal local (sem autenticação, sem deploy remoto)

---

## 1. Visão Geral

Sistema web de gestão financeira pessoal instalável como PWA. Permite registrar entradas e saídas, gerenciar contas mensais, acompanhar dívidas e visualizar um dashboard mensal consolidado. Roda localmente no Mac com PostgreSQL via Docker.

**Fora do escopo desta fase:** autenticação de usuários, múltiplos perfis, integração bancária, módulo de investimentos detalhado, deploy remoto.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 + Express 4 |
| Banco de dados | PostgreSQL 15 (Docker) |
| Acesso ao banco | node-postgres (`pg`) |
| Migrations | Arquivos `.sql` numerados + script Node |
| Frontend | React 18 + Vite 5 |
| Estilo | Tailwind CSS (mobile-first) |
| PWA | `vite-plugin-pwa` |
| Dev runner | `concurrently` |

---

## 3. Estrutura de Diretórios

```
/Financeiro
  /server
    /src
      /routes
        lancamentos.js
        contas.js
        dividas.js
        categorias.js
        dashboard.js
      /db
        index.js          ← pool de conexão pg
        migrate.js        ← script que roda migrations em ordem
        /migrations
          001_init.sql
          002_seed_categorias.sql
        seed.sql          ← categorias padrão
    index.js              ← Express entry point, porta 3001
    .env
    package.json

  /client
    /src
      /pages
        Dashboard.jsx
        Lancamentos.jsx
        Contas.jsx
        Dividas.jsx
      /components
        BottomNav.jsx
        MonthPicker.jsx
        Modal.jsx
        FormLancamento.jsx
        FormConta.jsx
        FormDivida.jsx
        FormCategoria.jsx
        StatusBadge.jsx
        SaldoCard.jsx
      /api
        dashboard.js
        lancamentos.js
        contas.js
        dividas.js
        categorias.js
      App.jsx
      main.jsx
    index.html
    vite.config.js
    package.json

  docker-compose.yml
  package.json            ← scripts raiz
  .gitignore
```

---

## 4. Banco de Dados

### 4.1 Tabela `categorias`

```sql
CREATE TABLE categorias (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  tipo       VARCHAR(20) CHECK (tipo IN ('entrada', 'saida', 'ambos')),
  padrao     BOOLEAN DEFAULT false,
  arquivada  BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Categorias padrão pré-cadastradas via `seed.sql`:
Moradia, Contas, Cartões, Financiamentos/Empréstimos, Alimentação, Transporte, Lazer, Saúde, Educação, Investimentos, Renda/Receitas, Outros.

### 4.2 Tabela `lancamentos`

```sql
CREATE TABLE lancamentos (
  id              SERIAL PRIMARY KEY,
  descricao       VARCHAR(255) NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  data            DATE NOT NULL,
  tipo            VARCHAR(10) CHECK (tipo IN ('entrada', 'saida')),
  status          VARCHAR(15) CHECK (status IN ('pago', 'pendente')),
  categoria_id    INT REFERENCES categorias(id),
  recorrente      BOOLEAN DEFAULT false,
  recorrencia_dia INT,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

`recorrente + recorrencia_dia`: quando `recorrente = true`, ao marcar o lançamento como pago o sistema cria automaticamente o próximo do mesmo dia do mês seguinte.

### 4.3 Tabela `contas`

```sql
CREATE TABLE contas (
  id              SERIAL PRIMARY KEY,
  descricao       VARCHAR(255) NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  dia_vencimento  INT NOT NULL,
  mes_referencia  DATE NOT NULL,
  status          VARCHAR(15) CHECK (status IN ('paga', 'pendente', 'atrasada')),
  data_pagamento  DATE,
  categoria_id    INT REFERENCES categorias(id),
  fixa            BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

`mes_referencia` é sempre o primeiro dia do mês (ex: `2026-09-01`). Permite histórico mês a mês sem duplicar registros.

### 4.4 Tabela `dividas`

```sql
CREATE TABLE dividas (
  id             SERIAL PRIMARY KEY,
  descricao      VARCHAR(255) NOT NULL,
  tipo           VARCHAR(30) CHECK (tipo IN ('cartao', 'financiamento', 'emprestimo', 'parcelamento')),
  valor_total    NUMERIC(12,2) NOT NULL,
  num_parcelas   INT NOT NULL,
  valor_parcela  NUMERIC(12,2) NOT NULL,
  parcelas_pagas INT DEFAULT 0,
  data_inicio    DATE NOT NULL,
  data_termino   DATE NOT NULL,
  categoria_id   INT REFERENCES categorias(id),
  ativa          BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API REST

### Dashboard

```
GET /api/dashboard?mes=2026-09
```

Retorna:
```json
{
  "total_entradas": 5000.00,
  "total_saidas": 3200.00,
  "saldo": 1800.00,
  "contas_proximas": [],
  "contas_atrasadas": [],
  "gastos_por_categoria": [
    { "categoria": "Moradia", "total": 1200.00 }
  ]
}
```

`contas_proximas`: contas com `status = 'pendente'` vencendo nos próximos 7 dias.
`contas_atrasadas`: contas com `status = 'atrasada'` ou `dia_vencimento < hoje` e `status = 'pendente'`.

### Lançamentos

```
GET    /api/lancamentos?mes=&categoria=&status=&tipo=
POST   /api/lancamentos
PUT    /api/lancamentos/:id
DELETE /api/lancamentos/:id
```

### Contas Mensais

```
GET    /api/contas?mes=2026-09
POST   /api/contas
PUT    /api/contas/:id
DELETE /api/contas/:id
PATCH  /api/contas/:id/pagar     ← body: { data_pagamento }
```

### Dívidas

```
GET    /api/dividas?ativa=true
POST   /api/dividas
PUT    /api/dividas/:id
DELETE /api/dividas/:id
PATCH  /api/dividas/:id/parcela  ← incrementa parcelas_pagas em 1
```

### Categorias

```
GET    /api/categorias?arquivada=false
POST   /api/categorias
PUT    /api/categorias/:id
PATCH  /api/categorias/:id/arquivar
```

---

## 6. Frontend

### 6.1 Páginas

| Página | Descrição |
|---|---|
| `Dashboard` | Cards de saldo (entradas/saídas/saldo), alertas de contas vencidas/próximas, gráfico de gastos por categoria |
| `Lançamentos` | Lista filtrada por mês/categoria/status/tipo, botão de novo lançamento, edição e exclusão |
| `Contas` | Lista das contas do mês selecionado, badge de status, botão "Pagar" |
| `Dívidas` | Cards por dívida com barra de progresso de parcelas, total comprometido por mês |

### 6.2 Componentes Reutilizáveis

| Componente | Responsabilidade |
|---|---|
| `BottomNav` | Navegação fixa no rodapé com 4 ícones (Dashboard/Lançamentos/Contas/Dívidas) |
| `MonthPicker` | Seletor de mês/ano persistido em estado global (Context API) |
| `Modal` | Container modal genérico usado em todos os formulários |
| `StatusBadge` | Badge colorido: pago (verde), pendente (amarelo), atrasado (vermelho) |
| `SaldoCard` | Card de entrada, saída ou saldo com ícone e valor formatado em R$ |
| `Form*` | Formulários específicos por entidade dentro do Modal |

### 6.3 Gerenciamento de Estado

Context API do React para:
- Mês selecionado (compartilhado entre todas as páginas)
- Lista de categorias (carregada uma vez, reutilizada nos formulários)

Sem biblioteca de estado externa (Redux, Zustand) — desnecessário para este escopo.

### 6.4 PWA

Configurado via `vite-plugin-pwa`:
- `name`: "Samuell Finanças"
- `short_name`: "Finanças"
- `theme_color`: "#1e40af" (azul escuro)
- `display`: "standalone"
- `start_url`: "/"
- Service worker com cache de assets estáticos (cache-first)

---

## 7. Ambiente Local

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: samuell_financas
      POSTGRES_USER: samuel
      POSTGRES_PASSWORD: financas123
    ports:
      - "5432:5432"
    volumes:
      - ./pgdata:/var/lib/postgresql/data
```

> `./pgdata` é um bind mount — os dados ficam diretamente no filesystem do Mac, sobrevivem a qualquer restart ou `docker compose down`, e podem ser copiados como backup. A pasta `pgdata/` deve estar no `.gitignore`.

### server/.env

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=samuell_financas
DB_USER=samuel
DB_PASSWORD=financas123
PORT=3001
```

### Scripts (package.json raiz)

```json
{
  "scripts": {
    "dev":        "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "db:up":      "docker compose up -d",
    "db:migrate": "node server/src/db/migrate.js",
    "db:seed":    "psql postgresql://samuel:financas123@localhost:5432/samuell_financas -f server/src/db/seed.sql",
    "setup":      "npm run db:up && sleep 3 && npm run db:migrate && npm run db:seed"
  }
}
```

### Fluxo de Configuração do Zero

```bash
git clone <repo>
npm install
npm run setup    # sobe Docker, roda migrations, insere categorias padrão
npm run dev      # abre localhost:5173
```

---

## 8. Relatórios (Módulo Secundário)

Implementados como sub-páginas dentro da página Dashboard, não como módulo separado:

- Gráfico entradas x saídas por mês (últimos 6 meses)
- Gráfico de pizza: gastos por categoria no mês
- Evolução do saldo devedor total (soma de `valor_total - parcelas_pagas * valor_parcela`)
- Exportação CSV dos lançamentos por período via botão na página Lançamentos

Biblioteca de gráficos: **Recharts** (leve, compatível com React, sem dependências pesadas).

---

## 9. Fora do Escopo desta Fase

- Autenticação e múltiplos usuários
- Integração bancária (open finance)
- Módulo de investimentos detalhado
- Deploy remoto (Vercel, Supabase)
- Notificações push de vencimento

---

## 10. Preparação para Fase Futura

- `.env` usa variáveis genéricas compatíveis com Supabase (trocar `DB_HOST` e credenciais)
- Pool `pg` isolado em `db/index.js` — trocar por outro driver sem tocar nas rotas
- Sem lógica de negócio acoplada ao Express — fácil extração para serviços separados
