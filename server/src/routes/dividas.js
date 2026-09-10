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
