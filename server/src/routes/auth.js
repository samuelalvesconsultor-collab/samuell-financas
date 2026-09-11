const express = require('express')
const router  = express.Router()
const pool    = require('../db')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')

const SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-in-production'

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha obrigatórios' })

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' })

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET(), { expiresIn: '30d' })
  res.json({ token, email: user.email })
})

// POST /api/auth/register — só funciona se não existir nenhum usuário ainda
router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha obrigatórios' })

  const { rows: count } = await pool.query('SELECT COUNT(*) FROM users')
  if (parseInt(count[0].count) > 0)
    return res.status(403).json({ error: 'Registro encerrado' })

  const hash = await bcrypt.hash(password, 10)
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email.toLowerCase(), hash]
  )
  const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, SECRET(), { expiresIn: '30d' })
  res.status(201).json({ token, email: rows[0].email })
})

// GET /api/auth/me — valida token
router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Não autenticado' })
  try {
    const payload = jwt.verify(auth.slice(7), SECRET())
    res.json({ email: payload.email })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

module.exports = router
