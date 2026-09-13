require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const pool    = require('./src/db')

const app = express()
app.use(cors())
app.use(express.json())

// Auto-migrate: add parcela_atual column if not exists
pool.query('ALTER TABLE contas ADD COLUMN IF NOT EXISTS parcela_atual INTEGER').catch(() => {})

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/categorias',    require('./src/routes/categorias'))
app.use('/api/lancamentos',   require('./src/routes/lancamentos'))
app.use('/api/contas',        require('./src/routes/contas'))
app.use('/api/dividas',       require('./src/routes/dividas'))
app.use('/api/dashboard',     require('./src/routes/dashboard'))
app.use('/api/parcelas',      require('./src/routes/parcelas'))
app.use('/api/configuracoes', require('./src/routes/configuracoes'))
app.use('/api/gastos',        require('./src/routes/gastos'))

// Dev local: escuta na porta; Vercel: exporta o app
if (process.env.VERCEL) {
  module.exports = app
} else {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  module.exports = app
}
