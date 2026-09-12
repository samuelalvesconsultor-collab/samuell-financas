require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const requireAuth = require('./src/middleware/requireAuth')

const app = express()
app.use(cors())
app.use(express.json())

// Rotas públicas
app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', require('./src/routes/auth'))

// Rotas protegidas
app.use('/api/categorias',   requireAuth, require('./src/routes/categorias'))
app.use('/api/lancamentos',  requireAuth, require('./src/routes/lancamentos'))
app.use('/api/contas',       requireAuth, require('./src/routes/contas'))
app.use('/api/dividas',      requireAuth, require('./src/routes/dividas'))
app.use('/api/dashboard',    requireAuth, require('./src/routes/dashboard'))
app.use('/api/parcelas',     requireAuth, require('./src/routes/parcelas'))
app.use('/api/configuracoes',requireAuth, require('./src/routes/configuracoes'))
app.use('/api/gastos',       requireAuth, require('./src/routes/gastos'))

// Dev local: escuta na porta; Vercel: exporta o app
if (process.env.VERCEL) {
  module.exports = app
} else {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  module.exports = app
}
