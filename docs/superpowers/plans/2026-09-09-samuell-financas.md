# Samuell Finanças — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um sistema web de gestão financeira pessoal (PWA) com backend Express + PostgreSQL e frontend React, rodando localmente no Mac via Docker.

**Architecture:** Monorepo com `/server` (Express + node-postgres, porta 3001) e `/client` (React + Vite, porta 5173). O Vite faz proxy de `/api` para o servidor. PostgreSQL 15 sobe via Docker com bind mount em `./pgdata` para persistência no filesystem do Mac. Sem autenticação nesta fase.

**Tech Stack:** Node.js 20, Express 4, node-postgres (`pg`), PostgreSQL 15 (Docker), React 18, Vite 5, Tailwind CSS, vite-plugin-pwa, concurrently, react-router-dom, recharts.

---

## Mapa de Arquivos

```
/Financeiro
  docker-compose.yml
  package.json
  .gitignore

  /server
    index.js
    .env
    package.json
    /src
      /db
        index.js
        migrate.js
        seed.sql
        /migrations
          001_init.sql
      /routes
        categorias.js
        lancamentos.js
        contas.js
        dividas.js
        dashboard.js

  /client
    package.json
    vite.config.js
    index.html
    tailwind.config.js
    postcss.config.js
    /src
      main.jsx
      App.jsx
      /context
        AppContext.jsx
      /api
        categorias.js
        lancamentos.js
        contas.js
        dividas.js
        dashboard.js
      /components
        BottomNav.jsx
        MonthPicker.jsx
        Modal.jsx
        StatusBadge.jsx
        SaldoCard.jsx
        FormLancamento.jsx
        FormConta.jsx
        FormDivida.jsx
        FormCategoria.jsx
      /pages
        Dashboard.jsx
        Lancamentos.jsx
        Contas.jsx
        Dividas.jsx
```

---

## Task 1: Scaffold raiz + Docker + .gitignore

**Files:**
- Create: `docker-compose.yml`
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Criar `docker-compose.yml`**

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

- [ ] **Criar `package.json` raiz**

```json
{
  "name": "samuell-financas",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:migrate": "node server/src/db/migrate.js",
    "db:seed": "node server/src/db/seed.js",
    "setup": "npm run db:up && node -e \"setTimeout(()=>{},4000)\" && npm run db:migrate && npm run db:seed"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Criar `.gitignore`**

```
node_modules/
.env
pgdata/
dist/
.DS_Store
```

- [ ] **Instalar concurrently**

```bash
cd /Users/samuelalves/Financeiro && npm install
```

- [ ] **Subir o PostgreSQL e verificar**

```bash
docker compose up -d
docker compose ps
```

Esperado: container `financeiro-postgres-1` com status `running`.

- [ ] **Commit**

```bash
git init
git add docker-compose.yml package.json package-lock.json .gitignore
git commit -m "chore: scaffold raiz, Docker e .gitignore"
```

---

## Task 2: Server scaffold + conexão com o banco

**Files:**
- Create: `server/package.json`
- Create: `server/index.js`
- Create: `server/.env`
- Create: `server/src/db/index.js`

- [ ] **Criar `server/package.json`**

```json
{
  "name": "samuell-financas-server",
  "type": "commonjs",
  "scripts": {
    "dev": "node --watch src/../index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "pg": "^8.12.0"
  }
}
```

- [ ] **Instalar dependências do servidor**

```bash
cd /Users/samuelalves/Financeiro/server && npm install
```

- [ ] **Criar `server/.env`**

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=samuell_financas
DB_USER=samuel
DB_PASSWORD=financas123
PORT=3001
```

- [ ] **Criar `server/src/db/index.js`**

```js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

module.exports = pool
```

- [ ] **Criar `server/index.js`**

```js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

- [ ] **Testar que o servidor sobe e conecta**

```bash
cd /Users/samuelalves/Financeiro/server && npm run dev
```

Em outro terminal:
```bash
curl http://localhost:3001/api/health
```

Esperado: `{"ok":true}`

- [ ] **Commit**

```bash
git add server/
git commit -m "feat: scaffold do servidor Express com conexão pg"
```

---

## Task 3: Migrations e seed de categorias

**Files:**
- Create: `server/src/db/migrations/001_init.sql`
- Create: `server/src/db/migrate.js`
- Create: `server/src/db/seed.sql`
- Create: `server/src/db/seed.js`

- [ ] **Criar `server/src/db/migrations/001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS categorias (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  tipo       VARCHAR(20) CHECK (tipo IN ('entrada', 'saida', 'ambos')),
  padrao     BOOLEAN DEFAULT false,
  arquivada  BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lancamentos (
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

CREATE TABLE IF NOT EXISTS contas (
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

CREATE TABLE IF NOT EXISTS dividas (
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

- [ ] **Criar `server/src/db/migrate.js`**

```js
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    console.log(`Running migration: ${file}`)
    await pool.query(sql)
  }

  await pool.end()
  console.log('Migrations complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Criar `server/src/db/seed.sql`**

```sql
INSERT INTO categorias (nome, tipo, padrao) VALUES
  ('Moradia', 'saida', true),
  ('Contas', 'saida', true),
  ('Cartões', 'saida', true),
  ('Financiamentos/Empréstimos', 'saida', true),
  ('Alimentação', 'saida', true),
  ('Transporte', 'saida', true),
  ('Lazer', 'saida', true),
  ('Saúde', 'saida', true),
  ('Educação', 'saida', true),
  ('Investimentos', 'ambos', true),
  ('Renda/Receitas', 'entrada', true),
  ('Outros', 'ambos', true)
ON CONFLICT DO NOTHING;
```

- [ ] **Criar `server/src/db/seed.js`**

```js
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8')
  await pool.query(sql)
  await pool.end()
  console.log('Seed complete.')
}

seed().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Rodar migrations e seed**

```bash
cd /Users/samuelalves/Financeiro
npm run db:migrate
npm run db:seed
```

Esperado:
```
Running migration: 001_init.sql
Migrations complete.
Seed complete.
```

- [ ] **Verificar tabelas no banco**

```bash
docker exec -it $(docker ps -q -f name=postgres) psql -U samuel -d samuell_financas -c "\dt"
```

Esperado: 4 tabelas listadas (`categorias`, `lancamentos`, `contas`, `dividas`).

```bash
docker exec -it $(docker ps -q -f name=postgres) psql -U samuel -d samuell_financas -c "SELECT id, nome FROM categorias;"
```

Esperado: 12 linhas com as categorias padrão.

- [ ] **Commit**

```bash
git add server/src/db/
git commit -m "feat: migrations SQL e seed de categorias padrão"
```

---

## Task 4: Rota de Categorias

**Files:**
- Create: `server/src/routes/categorias.js`
- Modify: `server/index.js`

- [ ] **Criar `server/src/routes/categorias.js`**

```js
const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const arquivada = req.query.arquivada === 'true' ? true : false
  const mostrarArquivadas = req.query.arquivada !== undefined
  const sql = mostrarArquivadas
    ? 'SELECT * FROM categorias WHERE arquivada = $1 ORDER BY nome'
    : 'SELECT * FROM categorias ORDER BY nome'
  const params = mostrarArquivadas ? [arquivada] : []
  const { rows } = await pool.query(sql, params)
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { nome, tipo } = req.body
  const { rows } = await pool.query(
    'INSERT INTO categorias (nome, tipo) VALUES ($1, $2) RETURNING *',
    [nome, tipo]
  )
  res.status(201).json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { nome, tipo } = req.body
  const { rows } = await pool.query(
    'UPDATE categorias SET nome=$1, tipo=$2 WHERE id=$3 RETURNING *',
    [nome, tipo, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

router.patch('/:id/arquivar', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE categorias SET arquivada = NOT arquivada WHERE id=$1 RETURNING *',
    [req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

module.exports = router
```

- [ ] **Registrar rota em `server/index.js`**

Substituir o conteúdo de `server/index.js` por:

```js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/categorias', require('./src/routes/categorias'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

- [ ] **Testar os endpoints**

```bash
# Listar categorias
curl http://localhost:3001/api/categorias

# Criar categoria
curl -X POST http://localhost:3001/api/categorias \
  -H "Content-Type: application/json" \
  -d '{"nome":"Pets","tipo":"saida"}'

# Arquivar categoria (use o id retornado acima)
curl -X PATCH http://localhost:3001/api/categorias/13/arquivar
```

- [ ] **Commit**

```bash
git add server/src/routes/categorias.js server/index.js
git commit -m "feat: CRUD de categorias"
```

---

## Task 5: Rota de Lançamentos

**Files:**
- Create: `server/src/routes/lancamentos.js`
- Modify: `server/index.js`

- [ ] **Criar `server/src/routes/lancamentos.js`**

```js
const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const { mes, categoria, status, tipo } = req.query
  let conditions = []
  let params = []
  let i = 1

  if (mes) {
    conditions.push(`DATE_TRUNC('month', data) = DATE_TRUNC('month', $${i}::date)`)
    params.push(`${mes}-01`)
    i++
  }
  if (categoria) { conditions.push(`categoria_id = $${i++}`); params.push(categoria) }
  if (status) { conditions.push(`status = $${i++}`); params.push(status) }
  if (tipo) { conditions.push(`tipo = $${i++}`); params.push(tipo) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(
    `SELECT l.*, c.nome as categoria_nome FROM lancamentos l
     LEFT JOIN categorias c ON l.categoria_id = c.id
     ${where} ORDER BY data DESC`,
    params
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia } = req.body
  const { rows } = await pool.query(
    `INSERT INTO lancamentos (descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [descricao, valor, data, tipo, status, categoria_id, recorrente || false, recorrencia_dia || null]
  )
  res.status(201).json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia } = req.body
  const { rows } = await pool.query(
    `UPDATE lancamentos SET descricao=$1, valor=$2, data=$3, tipo=$4, status=$5,
     categoria_id=$6, recorrente=$7, recorrencia_dia=$8 WHERE id=$9 RETURNING *`,
    [descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })

  // Se marcou como pago e é recorrente, cria o próximo mês
  if (status === 'pago' && recorrente && recorrencia_dia) {
    const dataOriginal = new Date(data)
    const proximo = new Date(dataOriginal.getFullYear(), dataOriginal.getMonth() + 1, recorrencia_dia)
    await pool.query(
      `INSERT INTO lancamentos (descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia)
       VALUES ($1,$2,$3,$4,'pendente',$5,$6,$7)`,
      [descricao, valor, proximo.toISOString().split('T')[0], tipo, categoria_id, true, recorrencia_dia]
    )
  }

  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM lancamentos WHERE id=$1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Não encontrado' })
  res.status(204).end()
})

module.exports = router
```

- [ ] **Registrar rota em `server/index.js`** (adicionar linha após categorias)

```js
app.use('/api/lancamentos', require('./src/routes/lancamentos'))
```

- [ ] **Testar**

```bash
# Criar lançamento
curl -X POST http://localhost:3001/api/lancamentos \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Salário","valor":5000,"data":"2026-09-05","tipo":"entrada","status":"pago","categoria_id":11}'

# Listar do mês
curl "http://localhost:3001/api/lancamentos?mes=2026-09"
```

- [ ] **Commit**

```bash
git add server/src/routes/lancamentos.js server/index.js
git commit -m "feat: CRUD de lançamentos com geração automática de recorrência"
```

---

## Task 6: Rota de Contas Mensais

**Files:**
- Create: `server/src/routes/contas.js`
- Modify: `server/index.js`

- [ ] **Criar `server/src/routes/contas.js`**

```js
const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const { mes } = req.query
  let sql = `SELECT c.*, cat.nome as categoria_nome FROM contas c
             LEFT JOIN categorias cat ON c.categoria_id = cat.id`
  const params = []
  if (mes) {
    sql += ` WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)`
    params.push(`${mes}-01`)
  }
  sql += ' ORDER BY dia_vencimento'
  const { rows } = await pool.query(sql, params)
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { descricao, valor, dia_vencimento, mes_referencia, categoria_id, fixa } = req.body
  const { rows } = await pool.query(
    `INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, fixa)
     VALUES ($1,$2,$3,$4,'pendente',$5,$6) RETURNING *`,
    [descricao, valor, dia_vencimento, mes_referencia, categoria_id, fixa !== false]
  )
  res.status(201).json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, fixa } = req.body
  const { rows } = await pool.query(
    `UPDATE contas SET descricao=$1, valor=$2, dia_vencimento=$3, mes_referencia=$4,
     status=$5, categoria_id=$6, fixa=$7 WHERE id=$8 RETURNING *`,
    [descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, fixa, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

router.patch('/:id/pagar', async (req, res) => {
  const { data_pagamento } = req.body
  const { rows } = await pool.query(
    `UPDATE contas SET status='paga', data_pagamento=$1 WHERE id=$2 RETURNING *`,
    [data_pagamento || new Date().toISOString().split('T')[0], req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM contas WHERE id=$1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Não encontrado' })
  res.status(204).end()
})

module.exports = router
```

- [ ] **Registrar rota em `server/index.js`**

```js
app.use('/api/contas', require('./src/routes/contas'))
```

- [ ] **Testar**

```bash
curl -X POST http://localhost:3001/api/contas \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Aluguel","valor":1200,"dia_vencimento":10,"mes_referencia":"2026-09-01","categoria_id":1}'

curl "http://localhost:3001/api/contas?mes=2026-09"

curl -X PATCH http://localhost:3001/api/contas/1/pagar \
  -H "Content-Type: application/json" \
  -d '{"data_pagamento":"2026-09-10"}'
```

- [ ] **Commit**

```bash
git add server/src/routes/contas.js server/index.js
git commit -m "feat: CRUD de contas mensais com endpoint pagar"
```

---

## Task 7: Rota de Dívidas

**Files:**
- Create: `server/src/routes/dividas.js`
- Modify: `server/index.js`

- [ ] **Criar `server/src/routes/dividas.js`**

```js
const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const { ativa } = req.query
  let sql = `SELECT d.*, cat.nome as categoria_nome,
             (d.num_parcelas - d.parcelas_pagas) as parcelas_restantes,
             ROUND((d.num_parcelas - d.parcelas_pagas) * d.valor_parcela, 2) as saldo_devedor
             FROM dividas d LEFT JOIN categorias cat ON d.categoria_id = cat.id`
  const params = []
  if (ativa !== undefined) {
    sql += ' WHERE d.ativa = $1'
    params.push(ativa === 'true')
  }
  sql += ' ORDER BY d.created_at DESC'
  const { rows } = await pool.query(sql, params)
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id } = req.body
  const { rows } = await pool.query(
    `INSERT INTO dividas (descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id]
  )
  res.status(201).json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id, ativa } = req.body
  const { rows } = await pool.query(
    `UPDATE dividas SET descricao=$1, tipo=$2, valor_total=$3, num_parcelas=$4, valor_parcela=$5,
     data_inicio=$6, data_termino=$7, categoria_id=$8, ativa=$9 WHERE id=$10 RETURNING *`,
    [descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id, ativa, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

router.patch('/:id/parcela', async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE dividas SET parcelas_pagas = parcelas_pagas + 1,
     ativa = CASE WHEN parcelas_pagas + 1 >= num_parcelas THEN false ELSE true END
     WHERE id=$1 RETURNING *`,
    [req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM dividas WHERE id=$1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Não encontrado' })
  res.status(204).end()
})

module.exports = router
```

- [ ] **Registrar rota em `server/index.js`**

```js
app.use('/api/dividas', require('./src/routes/dividas'))
```

- [ ] **Testar**

```bash
curl -X POST http://localhost:3001/api/dividas \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Financiamento Carro","tipo":"financiamento","valor_total":24000,"num_parcelas":48,"valor_parcela":500,"data_inicio":"2024-01-01","data_termino":"2027-12-01","categoria_id":4}'

curl "http://localhost:3001/api/dividas?ativa=true"

curl -X PATCH http://localhost:3001/api/dividas/1/parcela
```

- [ ] **Commit**

```bash
git add server/src/routes/dividas.js server/index.js
git commit -m "feat: CRUD de dívidas com controle de parcelas"
```

---

## Task 8: Rota de Dashboard

**Files:**
- Create: `server/src/routes/dashboard.js`
- Modify: `server/index.js`

- [ ] **Criar `server/src/routes/dashboard.js`**

```js
const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7)
  const mesDate = `${mes}-01`

  const [entradas, saidas, contasProximas, contasAtrasadas, gastosCat] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos
       WHERE tipo='entrada' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)`,
      [mesDate]
    ),
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos
       WHERE tipo='saida' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)`,
      [mesDate]
    ),
    pool.query(
      `SELECT c.*, cat.nome as categoria_nome FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status='pendente'
       AND (MAKE_DATE(EXTRACT(YEAR FROM mes_referencia)::int, EXTRACT(MONTH FROM mes_referencia)::int, dia_vencimento))
           BETWEEN CURRENT_DATE AND CURRENT_DATE + 7`,
      [mesDate]
    ),
    pool.query(
      `SELECT c.*, cat.nome as categoria_nome FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status='atrasada'`,
      [mesDate]
    ),
    pool.query(
      `SELECT cat.nome as categoria, COALESCE(SUM(l.valor), 0) as total
       FROM lancamentos l
       LEFT JOIN categorias cat ON l.categoria_id = cat.id
       WHERE l.tipo='saida' AND DATE_TRUNC('month', l.data) = DATE_TRUNC('month', $1::date)
       GROUP BY cat.nome ORDER BY total DESC`,
      [mesDate]
    ),
  ])

  const total_entradas = parseFloat(entradas.rows[0].total)
  const total_saidas = parseFloat(saidas.rows[0].total)

  res.json({
    total_entradas,
    total_saidas,
    saldo: total_entradas - total_saidas,
    contas_proximas: contasProximas.rows,
    contas_atrasadas: contasAtrasadas.rows,
    gastos_por_categoria: gastosCat.rows,
  })
})

module.exports = router
```

- [ ] **Registrar rota em `server/index.js`**

```js
app.use('/api/dashboard', require('./src/routes/dashboard'))
```

- [ ] **Testar**

```bash
curl "http://localhost:3001/api/dashboard?mes=2026-09"
```

Esperado: JSON com `total_entradas`, `total_saidas`, `saldo`, arrays de contas e gastos por categoria.

- [ ] **Commit**

```bash
git add server/src/routes/dashboard.js server/index.js
git commit -m "feat: endpoint de dashboard com resumo mensal"
```

---

## Task 9: Scaffold do cliente React + Vite + Tailwind + PWA

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/index.css`
- Create: `client/src/App.jsx`

- [ ] **Criar `client/package.json`**

```json
{
  "name": "samuell-financas-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.1",
    "vite-plugin-pwa": "^0.20.1"
  }
}
```

- [ ] **Instalar dependências do cliente**

```bash
cd /Users/samuelalves/Financeiro/client && npm install
```

- [ ] **Criar `client/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Samuell Finanças',
        short_name: 'Finanças',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Criar `client/tailwind.config.js`**

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Criar `client/postcss.config.js`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Criar `client/index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Samuell Finanças</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Criar `client/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Criar `client/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Criar `client/src/App.jsx` (placeholder para verificar funcionamento)**

```jsx
export default function App() {
  return <div className="p-4 text-blue-800 text-xl font-bold">Samuell Finanças</div>
}
```

- [ ] **Verificar que o frontend sobe**

Com o servidor ainda rodando em outra aba:

```bash
cd /Users/samuelalves/Financeiro/client && npm run dev
```

Abrir `http://localhost:5173` no navegador. Deve exibir "Samuell Finanças" em azul.

- [ ] **Commit**

```bash
git add client/
git commit -m "feat: scaffold do cliente React com Vite, Tailwind e PWA"
```

---

## Task 10: Context + Roteamento + BottomNav + MonthPicker

**Files:**
- Create: `client/src/context/AppContext.jsx`
- Create: `client/src/components/BottomNav.jsx`
- Create: `client/src/components/MonthPicker.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Criar `client/src/context/AppContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const now = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(setCategorias)
  }, [])

  return (
    <AppContext.Provider value={{ mesSelecionado, setMesSelecionado, categorias, setCategorias }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
```

- [ ] **Criar `client/src/components/BottomNav.jsx`**

```jsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/lancamentos', label: 'Lançamentos', icon: '💰' },
  { to: '/contas', label: 'Contas', icon: '📋' },
  { to: '/dividas', label: 'Dívidas', icon: '💳' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-500'}`
          }
        >
          <span className="text-xl">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Criar `client/src/components/MonthPicker.jsx`**

```jsx
import { useApp } from '../context/AppContext'

export default function MonthPicker() {
  const { mesSelecionado, setMesSelecionado } = useApp()

  function anterior() {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    const d = new Date(ano, mes - 2)
    setMesSelecionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function proximo() {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    const d = new Date(ano, mes)
    setMesSelecionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [ano, mes] = mesSelecionado.split('-').map(Number)
  const label = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center gap-3">
      <button onClick={anterior} className="text-blue-700 font-bold text-lg px-2">‹</button>
      <span className="capitalize font-semibold text-gray-700">{label}</span>
      <button onClick={proximo} className="text-blue-700 font-bold text-lg px-2">›</button>
    </div>
  )
}
```

- [ ] **Substituir `client/src/App.jsx` com roteamento completo**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import Dividas from './pages/Dividas'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="pb-16 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/dividas" element={<Dividas />} />
          </Routes>
        </div>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  )
}
```

- [ ] **Criar páginas placeholder para o roteamento funcionar**

Criar `client/src/pages/Dashboard.jsx`:
```jsx
export default function Dashboard() { return <div className="p-4">Dashboard</div> }
```

Criar `client/src/pages/Lancamentos.jsx`:
```jsx
export default function Lancamentos() { return <div className="p-4">Lançamentos</div> }
```

Criar `client/src/pages/Contas.jsx`:
```jsx
export default function Contas() { return <div className="p-4">Contas</div> }
```

Criar `client/src/pages/Dividas.jsx`:
```jsx
export default function Dividas() { return <div className="p-4">Dívidas</div> }
```

- [ ] **Verificar navegação no browser**

Abrir `http://localhost:5173`. A barra de navegação inferior deve aparecer com 4 abas. Clicar em cada uma deve trocar o conteúdo.

- [ ] **Commit**

```bash
git add client/src/
git commit -m "feat: context global, roteamento e navegação inferior"
```

---

## Task 11: Componentes base reutilizáveis

**Files:**
- Create: `client/src/components/StatusBadge.jsx`
- Create: `client/src/components/SaldoCard.jsx`
- Create: `client/src/components/Modal.jsx`

- [ ] **Criar `client/src/components/StatusBadge.jsx`**

```jsx
const styles = {
  pago:     'bg-green-100 text-green-800',
  paga:     'bg-green-100 text-green-800',
  pendente: 'bg-yellow-100 text-yellow-800',
  atrasada: 'bg-red-100 text-red-800',
  atrasado: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
```

- [ ] **Criar `client/src/components/SaldoCard.jsx`**

```jsx
export default function SaldoCard({ label, valor, cor }) {
  const cores = {
    verde:  'bg-green-50 border-green-200 text-green-700',
    vermelho: 'bg-red-50 border-red-200 text-red-700',
    azul:   'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${cores[cor] || cores.azul}`}>
      <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-2xl font-bold">
        {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    </div>
  )
}
```

- [ ] **Criar `client/src/components/Modal.jsx`**

```jsx
import { useEffect } from 'react'

export default function Modal({ titulo, onClose, children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add client/src/components/StatusBadge.jsx client/src/components/SaldoCard.jsx client/src/components/Modal.jsx
git commit -m "feat: componentes base StatusBadge, SaldoCard e Modal"
```

---

## Task 12: API wrappers do frontend

**Files:**
- Create: `client/src/api/dashboard.js`
- Create: `client/src/api/lancamentos.js`
- Create: `client/src/api/contas.js`
- Create: `client/src/api/dividas.js`
- Create: `client/src/api/categorias.js`

- [ ] **Criar `client/src/api/dashboard.js`**

```js
export async function getDashboard(mes) {
  const r = await fetch(`/api/dashboard?mes=${mes}`)
  return r.json()
}
```

- [ ] **Criar `client/src/api/lancamentos.js`**

```js
export async function getLancamentos(params = {}) {
  const q = new URLSearchParams(params).toString()
  const r = await fetch(`/api/lancamentos${q ? '?' + q : ''}`)
  return r.json()
}

export async function criarLancamento(data) {
  const r = await fetch('/api/lancamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarLancamento(id, data) {
  const r = await fetch(`/api/lancamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function deletarLancamento(id) {
  await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' })
}
```

- [ ] **Criar `client/src/api/contas.js`**

```js
export async function getContas(mes) {
  const r = await fetch(`/api/contas?mes=${mes}`)
  return r.json()
}

export async function criarConta(data) {
  const r = await fetch('/api/contas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarConta(id, data) {
  const r = await fetch(`/api/contas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function pagarConta(id, data_pagamento) {
  const r = await fetch(`/api/contas/${id}/pagar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_pagamento }),
  })
  return r.json()
}

export async function deletarConta(id) {
  await fetch(`/api/contas/${id}`, { method: 'DELETE' })
}
```

- [ ] **Criar `client/src/api/dividas.js`**

```js
export async function getDividas(ativa = true) {
  const r = await fetch(`/api/dividas?ativa=${ativa}`)
  return r.json()
}

export async function criarDivida(data) {
  const r = await fetch('/api/dividas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarDivida(id, data) {
  const r = await fetch(`/api/dividas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function registrarParcela(id) {
  const r = await fetch(`/api/dividas/${id}/parcela`, { method: 'PATCH' })
  return r.json()
}

export async function deletarDivida(id) {
  await fetch(`/api/dividas/${id}`, { method: 'DELETE' })
}
```

- [ ] **Criar `client/src/api/categorias.js`**

```js
export async function getCategorias(arquivada = false) {
  const r = await fetch(`/api/categorias?arquivada=${arquivada}`)
  return r.json()
}

export async function criarCategoria(data) {
  const r = await fetch('/api/categorias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarCategoria(id, data) {
  const r = await fetch(`/api/categorias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function arquivarCategoria(id) {
  const r = await fetch(`/api/categorias/${id}/arquivar`, { method: 'PATCH' })
  return r.json()
}
```

- [ ] **Commit**

```bash
git add client/src/api/
git commit -m "feat: wrappers de API do frontend para todas as entidades"
```

---

## Task 13: Página Dashboard

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Substituir `client/src/pages/Dashboard.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDashboard } from '../api/dashboard'
import SaldoCard from '../components/SaldoCard'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CORES = ['#1e40af','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#be185d','#65a30d']

export default function Dashboard() {
  const { mesSelecionado } = useApp()
  const [dados, setDados] = useState(null)

  useEffect(() => {
    getDashboard(mesSelecionado).then(setDados)
  }, [mesSelecionado])

  if (!dados) return <div className="p-4 text-gray-500">Carregando...</div>

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <MonthPicker />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SaldoCard label="Entradas" valor={dados.total_entradas} cor="verde" />
        <SaldoCard label="Saídas" valor={dados.total_saidas} cor="vermelho" />
        <SaldoCard label="Saldo" valor={dados.saldo} cor={dados.saldo >= 0 ? 'azul' : 'vermelho'} />
      </div>

      {dados.contas_atrasadas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-red-700 mb-2">Contas atrasadas</h2>
          {dados.contas_atrasadas.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1">
              <span className="text-sm text-red-800">{c.descricao}</span>
              <StatusBadge status="atrasada" />
            </div>
          ))}
        </div>
      )}

      {dados.contas_proximas.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-yellow-700 mb-2">Vencendo em breve</h2>
          {dados.contas_proximas.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1">
              <span className="text-sm text-yellow-800">{c.descricao}</span>
              <span className="text-sm font-medium text-yellow-900">
                {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {dados.gastos_por_categoria.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Gastos por categoria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={dados.gastos_por_categoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={80}>
                {dados.gastos_por_categoria.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {dados.gastos_por_categoria.map((g, i) => (
              <div key={g.categoria} className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: CORES[i % CORES.length] }} />
                  {g.categoria || 'Sem categoria'}
                </span>
                <span className="font-medium">
                  {Number(g.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Verificar visualmente no browser**

Abrir `http://localhost:5173`. O dashboard deve mostrar os cards de saldo, alertas e gráfico de pizza com os dados do banco.

- [ ] **Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "feat: página Dashboard com cards, alertas e gráfico de categorias"
```

---

## Task 14: FormLancamento + Página Lançamentos

**Files:**
- Create: `client/src/components/FormLancamento.jsx`
- Modify: `client/src/pages/Lancamentos.jsx`

- [ ] **Criar `client/src/components/FormLancamento.jsx`**

```jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const VAZIO = { descricao: '', valor: '', data: new Date().toISOString().split('T')[0], tipo: 'saida', status: 'pendente', categoria_id: '', recorrente: false, recorrencia_dia: '' }

export default function FormLancamento({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial || VAZIO)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({
      ...form,
      valor: parseFloat(form.valor),
      categoria_id: form.categoria_id || null,
      recorrencia_dia: form.recorrente ? parseInt(form.recorrencia_dia) : null,
    })
  }

  const catsFiltradas = categorias.filter(c => !c.arquivada && (c.tipo === form.tipo || c.tipo === 'ambos'))

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <input required type="number" step="0.01" placeholder="Valor" value={form.valor} onChange={e => set('valor', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="date" value={form.data} onChange={e => set('data', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Sem categoria</option>
        {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.recorrente} onChange={e => set('recorrente', e.target.checked)} />
        Lançamento recorrente
      </label>

      {form.recorrente && (
        <input type="number" min="1" max="31" placeholder="Dia do mês" value={form.recorrencia_dia}
          onChange={e => set('recorrencia_dia', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" />
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
      </div>
    </form>
  )
}
```

- [ ] **Substituir `client/src/pages/Lancamentos.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getLancamentos, criarLancamento, atualizarLancamento, deletarLancamento } from '../api/lancamentos'
import Modal from '../components/Modal'
import FormLancamento from '../components/FormLancamento'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'

export default function Lancamentos() {
  const { mesSelecionado, categorias } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null) // null | 'novo' | {lancamento}
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => {
    const params = { mes: mesSelecionado }
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    getLancamentos(params).then(setLista)
  }, [mesSelecionado, filtroTipo, filtroStatus])

  async function salvar(dados) {
    if (modal === 'novo') {
      await criarLancamento(dados)
    } else {
      await atualizarLancamento(modal.id, dados)
    }
    setModal(null)
    getLancamentos({ mes: mesSelecionado }).then(setLista)
  }

  async function excluir(id) {
    if (!confirm('Excluir lançamento?')) return
    await deletarLancamento(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  const total = lista.reduce((s, l) => s + (l.tipo === 'entrada' ? +l.valor : -l.valor), 0)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Lançamentos</h1>
        <MonthPicker />
      </div>

      <div className="flex gap-2">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="flex-1 border rounded-lg px-2 py-1 text-sm">
          <option value="">Todos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="flex-1 border rounded-lg px-2 py-1 text-sm">
          <option value="">Qualquer status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
      </div>

      <div className="text-right text-sm font-medium text-gray-600">
        Saldo do filtro: <span className={total >= 0 ? 'text-green-700' : 'text-red-700'}>
          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      <div className="space-y-2">
        {lista.map(l => (
          <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-800 text-sm">{l.descricao}</p>
              <p className="text-xs text-gray-400">{new Date(l.data).toLocaleDateString('pt-BR')} · {l.categoria_nome || '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`font-semibold text-sm ${l.tipo === 'entrada' ? 'text-green-700' : 'text-red-600'}`}>
                {l.tipo === 'entrada' ? '+' : '-'}{Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <StatusBadge status={l.status} />
              <div className="flex gap-2 mt-1">
                <button onClick={() => setModal(l)} className="text-xs text-blue-600">Editar</button>
                <button onClick={() => excluir(l.id)} className="text-xs text-red-500">Excluir</button>
              </div>
            </div>
          </div>
        ))}
        {!lista.length && <p className="text-center text-gray-400 text-sm py-8">Nenhum lançamento no período.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Novo Lançamento' : 'Editar Lançamento'} onClose={() => setModal(null)}>
          <FormLancamento inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Verificar no browser**

Abrir `http://localhost:5173/lancamentos`. Clicar no botão `+`, preencher o formulário e salvar. O lançamento deve aparecer na lista.

- [ ] **Commit**

```bash
git add client/src/pages/Lancamentos.jsx client/src/components/FormLancamento.jsx
git commit -m "feat: página de lançamentos com CRUD completo"
```

---

## Task 15: FormConta + Página Contas

**Files:**
- Create: `client/src/components/FormConta.jsx`
- Modify: `client/src/pages/Contas.jsx`

- [ ] **Criar `client/src/components/FormConta.jsx`**

```jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const VAZIO = (mes) => ({
  descricao: '', valor: '', dia_vencimento: '', mes_referencia: `${mes}-01`, categoria_id: '', fixa: true
})

export default function FormConta({ inicial, onSalvar, onCancelar }) {
  const { categorias, mesSelecionado } = useApp()
  const [form, setForm] = useState(inicial || VAZIO(mesSelecionado))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({ ...form, valor: parseFloat(form.valor), dia_vencimento: parseInt(form.dia_vencimento), categoria_id: form.categoria_id || null })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input required type="number" step="0.01" placeholder="Valor" value={form.valor} onChange={e => set('valor', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" min="1" max="31" placeholder="Dia vencimento" value={form.dia_vencimento} onChange={e => set('dia_vencimento', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Sem categoria</option>
        {categorias.filter(c => !c.arquivada).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.fixa} onChange={e => set('fixa', e.target.checked)} />
        Conta fixa
      </label>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
      </div>
    </form>
  )
}
```

- [ ] **Substituir `client/src/pages/Contas.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getContas, criarConta, atualizarConta, pagarConta, deletarConta } from '../api/contas'
import Modal from '../components/Modal'
import FormConta from '../components/FormConta'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'

export default function Contas() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)

  const carregar = () => getContas(mesSelecionado).then(setLista)
  useEffect(() => { carregar() }, [mesSelecionado])

  async function salvar(dados) {
    if (modal === 'novo') await criarConta(dados)
    else await atualizarConta(modal.id, { ...dados, status: modal.status })
    setModal(null)
    carregar()
  }

  async function pagar(id) {
    await pagarConta(id, new Date().toISOString().split('T')[0])
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir conta?')) return
    await deletarConta(id)
    carregar()
  }

  const hoje = new Date()
  const statusCalculado = (c) => {
    if (c.status === 'paga') return 'paga'
    const venc = new Date(hoje.getFullYear(), hoje.getMonth(), c.dia_vencimento)
    return venc < hoje ? 'atrasada' : 'pendente'
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Contas</h1>
        <MonthPicker />
      </div>

      <div className="space-y-2">
        {lista.map(c => {
          const status = statusCalculado(c)
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800 text-sm">{c.descricao}</p>
                <p className="text-xs text-gray-400">Vence dia {c.dia_vencimento} · {c.categoria_nome || '—'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-sm text-gray-800">
                  {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <StatusBadge status={status} />
                <div className="flex gap-2 mt-1">
                  {status !== 'paga' && <button onClick={() => pagar(c.id)} className="text-xs text-green-600 font-medium">Pagar</button>}
                  <button onClick={() => setModal(c)} className="text-xs text-blue-600">Editar</button>
                  <button onClick={() => excluir(c.id)} className="text-xs text-red-500">Excluir</button>
                </div>
              </div>
            </div>
          )
        })}
        {!lista.length && <p className="text-center text-gray-400 text-sm py-8">Nenhuma conta no período.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Nova Conta' : 'Editar Conta'} onClose={() => setModal(null)}>
          <FormConta inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Verificar no browser**

Abrir `http://localhost:5173/contas`. Criar uma conta, verificar badge de status, clicar em "Pagar".

- [ ] **Commit**

```bash
git add client/src/pages/Contas.jsx client/src/components/FormConta.jsx
git commit -m "feat: página de contas mensais com status visual e ação pagar"
```

---

## Task 16: FormDivida + Página Dívidas

**Files:**
- Create: `client/src/components/FormDivida.jsx`
- Modify: `client/src/pages/Dividas.jsx`

- [ ] **Criar `client/src/components/FormDivida.jsx`**

```jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const VAZIO = { descricao: '', tipo: 'parcelamento', valor_total: '', num_parcelas: '', valor_parcela: '', data_inicio: '', data_termino: '', categoria_id: '' }

export default function FormDivida({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial || VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({
      ...form,
      valor_total: parseFloat(form.valor_total),
      num_parcelas: parseInt(form.num_parcelas),
      valor_parcela: parseFloat(form.valor_parcela),
      categoria_id: form.categoria_id || null,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="cartao">Cartão de Crédito</option>
        <option value="financiamento">Financiamento</option>
        <option value="emprestimo">Empréstimo</option>
        <option value="parcelamento">Parcelamento</option>
      </select>
      <div className="grid grid-cols-3 gap-2">
        <input required type="number" step="0.01" placeholder="Total" value={form.valor_total} onChange={e => set('valor_total', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" placeholder="Parcelas" value={form.num_parcelas} onChange={e => set('num_parcelas', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" step="0.01" placeholder="Valor/parc." value={form.valor_parcela} onChange={e => set('valor_parcela', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Início</label>
          <input required type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Término</label>
          <input required type="date" value={form.data_termino} onChange={e => set('data_termino', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Sem categoria</option>
        {categorias.filter(c => !c.arquivada).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
      </div>
    </form>
  )
}
```

- [ ] **Substituir `client/src/pages/Dividas.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { getDividas, criarDivida, atualizarDivida, registrarParcela, deletarDivida } from '../api/dividas'
import Modal from '../components/Modal'
import FormDivida from '../components/FormDivida'

const TIPO_LABEL = { cartao: 'Cartão', financiamento: 'Financiamento', emprestimo: 'Empréstimo', parcelamento: 'Parcelamento' }

export default function Dividas() {
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [mostrarQuitadas, setMostrarQuitadas] = useState(false)

  const carregar = () => getDividas(!mostrarQuitadas).then(setLista)
  useEffect(() => { carregar() }, [mostrarQuitadas])

  async function salvar(dados) {
    if (modal === 'novo') await criarDivida(dados)
    else await atualizarDivida(modal.id, dados)
    setModal(null)
    carregar()
  }

  async function pagar(id) {
    await registrarParcela(id)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir dívida?')) return
    await deletarDivida(id)
    carregar()
  }

  const totalMensal = lista.filter(d => d.ativa).reduce((s, d) => s + +d.valor_parcela, 0)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Dívidas</h1>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={mostrarQuitadas} onChange={e => setMostrarQuitadas(e.target.checked)} />
          Ver quitadas
        </label>
      </div>

      {lista.some(d => d.ativa) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          Comprometido por mês: {totalMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}

      <div className="space-y-3">
        {lista.map(d => {
          const pct = Math.round((d.parcelas_pagas / d.num_parcelas) * 100)
          return (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{d.descricao}</p>
                  <p className="text-xs text-gray-400">{TIPO_LABEL[d.tipo]} · {d.categoria_nome || '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.ativa ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {d.ativa ? 'Ativa' : 'Quitada'}
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>{d.parcelas_pagas}/{d.num_parcelas} parcelas</span>
                <span>Saldo: {Number(d.saldo_devedor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>

              <div className="flex gap-2">
                {d.ativa && (
                  <button onClick={() => pagar(d.id)} className="text-xs text-green-600 font-medium border border-green-300 rounded-lg px-2 py-1">
                    + Parcela paga
                  </button>
                )}
                <button onClick={() => setModal(d)} className="text-xs text-blue-600">Editar</button>
                <button onClick={() => excluir(d.id)} className="text-xs text-red-500">Excluir</button>
              </div>
            </div>
          )
        })}
        {!lista.length && <p className="text-center text-gray-400 text-sm py-8">Nenhuma dívida cadastrada.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Nova Dívida' : 'Editar Dívida'} onClose={() => setModal(null)}>
          <FormDivida inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Verificar no browser**

Abrir `http://localhost:5173/dividas`. Criar uma dívida, verificar a barra de progresso, clicar em "+ Parcela paga".

- [ ] **Commit**

```bash
git add client/src/pages/Dividas.jsx client/src/components/FormDivida.jsx
git commit -m "feat: página de dívidas com progresso de parcelas"
```

---

## Task 17: Gerenciamento de Categorias (UI)

**Files:**
- Create: `client/src/components/FormCategoria.jsx`
- Create: `client/src/pages/Categorias.jsx` (acessível via botão no BottomNav ou modal na tela de lançamentos)
- Modify: `client/src/components/BottomNav.jsx` — adicionar ícone de configurações

- [ ] **Criar `client/src/components/FormCategoria.jsx`**

```jsx
import { useState } from 'react'

const VAZIO = { nome: '', tipo: 'saida' }

export default function FormCategoria({ inicial, onSalvar, onCancelar }) {
  const [form, setForm] = useState(inicial || VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar(form)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Nome da categoria" value={form.nome} onChange={e => set('nome', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="saida">Saída</option>
        <option value="entrada">Entrada</option>
        <option value="ambos">Ambos</option>
      </select>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
      </div>
    </form>
  )
}
```

- [ ] **Criar `client/src/pages/Categorias.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getCategorias, criarCategoria, atualizarCategoria, arquivarCategoria } from '../api/categorias'
import Modal from '../components/Modal'
import FormCategoria from '../components/FormCategoria'

export default function Categorias() {
  const { setCategorias } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)

  const carregar = async () => {
    const ativas = await getCategorias(false)
    const arquivadas = mostrarArquivadas ? await getCategorias(true) : []
    const todas = mostrarArquivadas ? [...ativas, ...arquivadas.filter(a => a.arquivada)] : ativas
    setLista(todas)
    setCategorias(ativas)
  }

  useEffect(() => { carregar() }, [mostrarArquivadas])

  async function salvar(dados) {
    if (modal === 'novo') await criarCategoria(dados)
    else await atualizarCategoria(modal.id, dados)
    setModal(null)
    carregar()
  }

  async function arquivar(id) {
    await arquivarCategoria(id)
    carregar()
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Categorias</h1>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={mostrarArquivadas} onChange={e => setMostrarArquivadas(e.target.checked)} />
          Ver arquivadas
        </label>
      </div>

      <div className="space-y-2">
        {lista.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className={`font-medium text-sm ${c.arquivada ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{c.nome}</p>
              <p className="text-xs text-gray-400 capitalize">{c.tipo} {c.padrao ? '· padrão' : ''}</p>
            </div>
            <div className="flex gap-2">
              {!c.padrao && <button onClick={() => setModal(c)} className="text-xs text-blue-600">Editar</button>}
              <button onClick={() => arquivar(c.id)} className="text-xs text-gray-500">
                {c.arquivada ? 'Restaurar' : 'Arquivar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Nova Categoria' : 'Editar Categoria'} onClose={() => setModal(null)}>
          <FormCategoria inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Adicionar rota `/categorias` em `client/src/App.jsx`**

Adicionar import e Route no App.jsx:

```jsx
import Categorias from './pages/Categorias'
// dentro de <Routes>:
<Route path="/categorias" element={<Categorias />} />
```

- [ ] **Atualizar `client/src/components/BottomNav.jsx` com aba de categorias**

```jsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/lancamentos', label: 'Lançamentos', icon: '💰' },
  { to: '/contas', label: 'Contas', icon: '📋' },
  { to: '/dividas', label: 'Dívidas', icon: '💳' },
  { to: '/categorias', label: 'Categorias', icon: '🏷️' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-500'}`
          }
        >
          <span className="text-xl">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Verificar no browser**

Abrir `http://localhost:5173/categorias`. Criar uma categoria nova, editar uma existente, arquivar uma.

- [ ] **Commit**

```bash
git add client/src/pages/Categorias.jsx client/src/components/FormCategoria.jsx client/src/components/BottomNav.jsx client/src/App.jsx
git commit -m "feat: gerenciamento de categorias com criar, editar e arquivar"
```

---

## Task 18: Exportação CSV de lançamentos

**Files:**
- Modify: `client/src/pages/Lancamentos.jsx`

- [ ] **Adicionar função `exportarCSV` em `client/src/pages/Lancamentos.jsx`**

Adicionar a função e o botão de exportação na página Lançamentos. Inserir após a declaração de `const carregar`:

```jsx
function exportarCSV() {
  const linhas = [
    ['Data', 'Descrição', 'Tipo', 'Categoria', 'Status', 'Valor'],
    ...lista.map(l => [
      new Date(l.data).toLocaleDateString('pt-BR'),
      l.descricao,
      l.tipo,
      l.categoria_nome || '',
      l.status,
      Number(l.valor).toFixed(2).replace('.', ','),
    ]),
  ]
  const csv = linhas.map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lancamentos-${mesSelecionado}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

Adicionar o botão de exportação ao lado do saldo do filtro:

```jsx
<div className="flex justify-between items-center">
  <div className="text-sm font-medium text-gray-600">
    Saldo do filtro: <span className={total >= 0 ? 'text-green-700' : 'text-red-700'}>
      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </span>
  </div>
  <button onClick={exportarCSV} className="text-xs text-blue-600 border border-blue-300 rounded-lg px-2 py-1">
    Exportar CSV
  </button>
</div>
```

- [ ] **Testar exportação**

Com lançamentos cadastrados, clicar em "Exportar CSV". O arquivo `lancamentos-2026-09.csv` deve ser baixado. Abrir no Excel ou Numbers e verificar as colunas.

- [ ] **Commit**

```bash
git add client/src/pages/Lancamentos.jsx
git commit -m "feat: exportação de lançamentos em CSV com BOM UTF-8"
```

---

## Task 19: Ícones PWA + verificação de instalabilidade

**Files:**
- Create: `client/public/icon-192.png`
- Create: `client/public/icon-512.png`

- [ ] **Gerar ícones PWA simples**

Execute este script Node para gerar os ícones (requer apenas módulos nativos do Node):

```bash
node -e "
const fs = require('fs');
// Cria um PNG mínimo válido de 1x1 pixel azul como placeholder
// Para ícones reais, substitua por imagens 192x192 e 512x512
const png192 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
fs.mkdirSync('client/public', { recursive: true });
fs.writeFileSync('client/public/icon-192.png', png192);
fs.writeFileSync('client/public/icon-512.png', png192);
console.log('Ícones placeholder criados.');
"
```

> Para ícones reais: substitua `client/public/icon-192.png` e `client/public/icon-512.png` por imagens PNG com as dimensões corretas (192×192 e 512×512 pixels).

- [ ] **Verificar instalabilidade PWA**

```bash
cd /Users/samuelalves/Financeiro/client && npm run build && npm run preview
```

Abrir `http://localhost:4173` no Chrome. Abrir DevTools → Application → Manifest. Deve mostrar o manifest sem erros. Em mobile, deve aparecer opção "Adicionar à tela inicial".

- [ ] **Commit**

```bash
git add client/public/
git commit -m "feat: ícones PWA e verificação de instalabilidade"
```

---

## Task 20: Script setup final + README de execução

**Files:**
- Modify: `package.json`

- [ ] **Atualizar `package.json` raiz com script setup corrigido**

```json
{
  "name": "samuell-financas",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:migrate": "node server/src/db/migrate.js",
    "db:seed": "node server/src/db/seed.js",
    "setup": "npm run db:up && sleep 4 && npm run db:migrate && npm run db:seed",
    "install:all": "npm install && npm install --prefix server && npm install --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Testar o fluxo completo do zero**

Em um terminal limpo, com o Docker rodando:

```bash
cd /Users/samuelalves/Financeiro
npm run install:all
npm run setup
npm run dev
```

Abrir `http://localhost:5173`. Navegar pelas 4 abas. Criar um lançamento, uma conta, uma dívida. Verificar que aparecem no Dashboard.

- [ ] **Commit final**

```bash
git add package.json
git commit -m "chore: script de setup completo e install:all"
```

---

## Checklist de Verificação Final

- [ ] `npm run setup` sobe o banco e roda migrations/seed sem erros
- [ ] `npm run dev` inicia servidor (3001) e cliente (5173) juntos
- [ ] Dashboard exibe totais corretos ao criar lançamentos
- [ ] Contas exibem badge de status correto (paga/pendente/atrasada)
- [ ] Dívidas exibem barra de progresso e decrementam saldo ao registrar parcela
- [ ] Filtros de lançamento funcionam (tipo, status, mês)
- [ ] Lançamento recorrente gera próximo período ao ser marcado como pago
- [ ] MonthPicker muda o mês em todas as páginas simultaneamente
- [ ] Modal fecha com ESC e com o botão ×
- [ ] Categorias: criar nova, editar existente, arquivar e restaurar
- [ ] Exportação CSV baixa arquivo com BOM UTF-8 legível no Excel/Numbers
- [ ] `./pgdata/` existe no filesystem do Mac após o primeiro `npm run setup`
- [ ] Restart do Docker não perde dados (testar com `docker compose down && docker compose up -d`)
