require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/categorias', require('./src/routes/categorias'))
app.use('/api/lancamentos', require('./src/routes/lancamentos'))
app.use('/api/contas', require('./src/routes/contas'))
app.use('/api/dividas', require('./src/routes/dividas'))
app.use('/api/dashboard', require('./src/routes/dashboard'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
