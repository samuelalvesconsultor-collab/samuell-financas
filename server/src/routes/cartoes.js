const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cartoes ORDER BY nome ASC')
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { nome, conta_pagamento, cor } = req.body
  const { rows } = await pool.query(
    `INSERT INTO cartoes (nome, conta_pagamento, cor) VALUES ($1, $2, $3) RETURNING *`,
    [nome, conta_pagamento || null, cor || '#6366f1']
  )
  res.json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { nome, conta_pagamento, cor } = req.body
  const { rows } = await pool.query(
    `UPDATE cartoes SET nome=$1, conta_pagamento=$2, cor=$3 WHERE id=$4 RETURNING *`,
    [nome, conta_pagamento || null, cor || '#6366f1', req.params.id]
  )
  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM cartoes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

router.get('/:id/gastos', async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7)
  const { rows } = await pool.query(
    `SELECT * FROM gastos
     WHERE cartao_id=$1 AND DATE_TRUNC('month', data) = DATE_TRUNC('month', ($2 || '-01')::date)
     ORDER BY data DESC, id DESC`,
    [req.params.id, mes]
  )
  res.json(rows)
})

module.exports = router
