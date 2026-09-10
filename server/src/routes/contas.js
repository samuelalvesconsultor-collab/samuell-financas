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
