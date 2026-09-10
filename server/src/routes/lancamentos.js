const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const { mes, categoria, status, tipo } = req.query
  let conditions = []
  let params = []
  let i = 1

  if (mes) {
    conditions.push(`DATE_TRUNC('month', l.data) = DATE_TRUNC('month', $${i}::date)`)
    params.push(`${mes}-01`)
    i++
  }
  if (categoria) { conditions.push(`l.categoria_id = $${i++}`); params.push(categoria) }
  if (status)    { conditions.push(`l.status = $${i++}`); params.push(status) }
  if (tipo)      { conditions.push(`l.tipo = $${i++}`); params.push(tipo) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(
    `SELECT l.*, c.nome as categoria_nome FROM lancamentos l
     LEFT JOIN categorias c ON l.categoria_id = c.id
     ${where} ORDER BY data DESC`,
    params
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia } = req.body
  const { rows } = await pool.query(
    `INSERT INTO lancamentos (descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [descricao, valor, data, tipo, status, categoria_id, recorrente || false, recorrencia_dia || null]
  )
  res.status(201).json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia } = req.body
  const { rows } = await pool.query(
    `UPDATE lancamentos SET descricao=$1, valor=$2, data=$3, tipo=$4, status=$5,
     categoria_id=$6, recorrente=$7, recorrencia_dia=$8 WHERE id=$9 RETURNING *`,
    [descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })

  if (status === 'pago' && recorrente && recorrencia_dia) {
    const dataOriginal = new Date(data)
    const proximo = new Date(dataOriginal.getFullYear(), dataOriginal.getMonth() + 1, recorrencia_dia)
    await pool.query(
      `INSERT INTO lancamentos (descricao, valor, data, tipo, status, categoria_id, recorrente, recorrencia_dia)
       VALUES ($1,$2,$3,$4,'pendente',$5,$6,$7)`,
      [descricao, valor, proximo.toISOString().split('T')[0], tipo, categoria_id, true, recorrencia_dia]
    )
  }

  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM lancamentos WHERE id=$1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Não encontrado' })
  res.status(204).end()
})

module.exports = router
