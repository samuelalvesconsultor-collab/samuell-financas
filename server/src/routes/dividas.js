const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const { ativa } = req.query
  let sql = `
    SELECT d.*, cat.nome as categoria_nome,
      COALESCE(p_stats.parcelas_pagas, 0) as parcelas_pagas,
      d.num_parcelas - COALESCE(p_stats.parcelas_pagas, 0) as parcelas_restantes,
      ROUND(d.valor_total - COALESCE(p_stats.valor_pago, 0), 2) as saldo_devedor,
      p_next.data_vencimento as proxima_vencimento
    FROM dividas d
    LEFT JOIN categorias cat ON d.categoria_id = cat.id
    LEFT JOIN (
      SELECT divida_id,
             COUNT(*) FILTER (WHERE status = 'paga') as parcelas_pagas,
             COALESCE(SUM(valor) FILTER (WHERE status = 'paga'), 0) as valor_pago
      FROM parcelas_divida GROUP BY divida_id
    ) p_stats ON p_stats.divida_id = d.id
    LEFT JOIN LATERAL (
      SELECT data_vencimento FROM parcelas_divida
      WHERE divida_id = d.id AND status = 'pendente'
      ORDER BY data_vencimento LIMIT 1
    ) p_next ON true`
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

  // 1. Inserir dívida
  const { rows: [divida] } = await pool.query(
    `INSERT INTO dividas (descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id]
  )

  // 2. Gerar parcelas mensais a partir de data_inicio
  const dataBase = new Date(data_inicio + 'T12:00:00Z')
  for (let i = 0; i < num_parcelas; i++) {
    const d = new Date(dataBase)
    d.setUTCMonth(d.getUTCMonth() + i)
    const venc = d.toISOString().split('T')[0]
    await pool.query(
      `INSERT INTO parcelas_divida (divida_id, numero_parcela, valor, data_vencimento) VALUES ($1,$2,$3,$4)`,
      [divida.id, i + 1, valor_parcela, venc]
    )
  }

  res.status(201).json(divida)
})

router.get('/:id/parcelas', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM parcelas_divida WHERE divida_id = $1 ORDER BY numero_parcela`,
    [req.params.id]
  )
  res.json(rows)
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
  // Pegar a próxima parcela pendente
  const { rows: [parcela] } = await pool.query(
    `SELECT * FROM parcelas_divida WHERE divida_id=$1 AND status='pendente' ORDER BY numero_parcela LIMIT 1`,
    [req.params.id]
  )
  if (!parcela) return res.status(400).json({ error: 'Todas as parcelas já foram pagas' })

  // Marca como paga
  await pool.query(
    `UPDATE parcelas_divida SET status='paga', data_pagamento=$1 WHERE id=$2`,
    [new Date().toISOString().split('T')[0], parcela.id]
  )

  // Verifica se todas foram pagas → desativa dívida
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) as count FROM parcelas_divida WHERE divida_id=$1 AND status='pendente'`,
    [req.params.id]
  )
  if (count === '0') {
    await pool.query(`UPDATE dividas SET ativa=false WHERE id=$1`, [req.params.id])
  }

  // Retorna a dívida atualizada
  const { rows: [divida] } = await pool.query(`SELECT * FROM dividas WHERE id=$1`, [req.params.id])
  res.json(divida)
})

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM dividas WHERE id=$1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Não encontrado' })
  res.status(204).end()
})

module.exports = router
