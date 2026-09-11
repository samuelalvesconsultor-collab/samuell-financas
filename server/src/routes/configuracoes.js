const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT chave, valor FROM configuracoes')
    const config = {}
    rows.forEach(r => {
      try { config[r.chave] = JSON.parse(r.valor) }
      catch { config[r.chave] = r.valor }
    })
    res.json(config)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.patch('/:chave', async (req, res) => {
  try {
    const { chave } = req.params
    const valorRaw = req.body.valor
    const valor = typeof valorRaw === 'string' ? valorRaw : JSON.stringify(valorRaw)
    await pool.query(
      `INSERT INTO configuracoes (chave, valor)
       VALUES ($1, $2)
       ON CONFLICT (chave) DO UPDATE SET valor = $2, updated_at = NOW()`,
      [chave, valor]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
