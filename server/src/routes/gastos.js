const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7)
  const mesDate = `${mes}-01`
  const { rows } = await pool.query(
    `SELECT * FROM gastos
     WHERE DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)
     ORDER BY data DESC, id DESC`,
    [mesDate]
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { descricao, valor, data, forma_pagamento, categoria } = req.body
  const { rows } = await pool.query(
    `INSERT INTO gastos (descricao, valor, data, forma_pagamento, categoria)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [descricao, valor, data, forma_pagamento, categoria]
  )
  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM gastos WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

module.exports = router
