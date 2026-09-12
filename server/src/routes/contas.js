const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /api/contas?mes=YYYY-MM
router.get('/', async (req, res) => {
  const { mes } = req.query

  if (!mes) {
    const { rows } = await pool.query(`
      SELECT c.*, cat.nome as categoria_nome, cat.cor as categoria_cor FROM contas c
      LEFT JOIN categorias cat ON c.categoria_id = cat.id
      WHERE c.recorrente = false
      ORDER BY c.mes_referencia DESC, c.dia_vencimento
    `)
    return res.json(rows)
  }

  const mesDate = `${mes}-01`

  try {
    const { rows: templates } = await pool.query(`
      SELECT * FROM contas
      WHERE recorrente = true AND conta_pai_id IS NULL
      AND DATE_TRUNC('month', mes_referencia) <= DATE_TRUNC('month', $1::date)
    `, [mesDate])

    for (const t of templates) {
      const { rows: existe } = await pool.query(`
        SELECT 1 FROM contas
        WHERE conta_pai_id = $1
        AND DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $2::date)
        LIMIT 1
      `, [t.id, mesDate])

      if (!existe.length) {
        await pool.query(`
          INSERT INTO contas
            (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente, conta_pai_id, forma_pagamento, tipo_pagamento)
          VALUES ($1, $2, $3, $4, 'pendente', $5, $6, false, $7, $8, 'recorrente')
        `, [t.descricao, t.valor, t.dia_vencimento, mesDate,
            t.categoria_id, t.cartao_vinculado, t.id, t.forma_pagamento])
      }
    }

    const { rows } = await pool.query(`
      SELECT c.*, cat.nome as categoria_nome, cat.cor as categoria_cor FROM contas c
      LEFT JOIN categorias cat ON c.categoria_id = cat.id
      WHERE DATE_TRUNC('month', c.mes_referencia) = DATE_TRUNC('month', $1::date)
      AND c.recorrente = false
      ORDER BY c.dia_vencimento
    `, [mesDate])

    res.json(rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /api/contas
router.post('/', async (req, res) => {
  const {
    descricao, valor, dia_vencimento, mes_referencia, status,
    categoria_id, recorrente, cartao_vinculado,
    forma_pagamento, num_parcelas, tipo_pagamento,
  } = req.body

  const isRec = recorrente === true || recorrente === 'true'
  const mesRef = mes_referencia || new Date().toISOString().slice(0, 7) + '-01'

  try {
    if (isRec) {
      const { rows: [tmpl] } = await pool.query(`
        INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente, forma_pagamento, tipo_pagamento)
        VALUES ($1, $2, $3, $4, 'pendente', $5, $6, true, $7, 'recorrente') RETURNING *
      `, [descricao, valor, dia_vencimento, mesRef, categoria_id || null, cartao_vinculado || null, forma_pagamento || null])

      const { rows: [inst] } = await pool.query(`
        INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente, conta_pai_id, forma_pagamento, tipo_pagamento)
        VALUES ($1, $2, $3, $4, 'pendente', $5, $6, false, $7, $8, 'recorrente') RETURNING *
      `, [descricao, valor, dia_vencimento, mesRef, categoria_id || null, cartao_vinculado || null, tmpl.id, forma_pagamento || null])

      return res.status(201).json(inst)
    }

    const dbStatus = ['paga', 'pendente', 'atrasada'].includes(status) ? status : 'pendente'
    const tipoFinal = tipo_pagamento || 'avista'
    const numParc = tipoFinal === 'parcelado' && num_parcelas ? parseInt(num_parcelas) : null

    const { rows: [conta] } = await pool.query(`
      INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente, forma_pagamento, num_parcelas, tipo_pagamento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10) RETURNING *
    `, [descricao, valor, dia_vencimento, mesRef, dbStatus,
        categoria_id || null, cartao_vinculado || null,
        forma_pagamento || null, numParc, tipoFinal])

    // Auto-cria dívida quando parcelado com 2+ parcelas
    if (tipoFinal === 'parcelado' && numParc >= 2) {
      const valorUnit = parseFloat(valor)
      const valorTotal = valorUnit * numParc
      const hoje = new Date()
      const dataInicio = hoje.toISOString().split('T')[0]
      const dataTermino = new Date(hoje)
      dataTermino.setUTCMonth(dataTermino.getUTCMonth() + numParc - 1)
      const dataTerminoStr = dataTermino.toISOString().split('T')[0]
      const formaDiv = forma_pagamento === 'credito' ? 'cartao_credito' : (forma_pagamento || 'boleto')
      const descDiv = cartao_vinculado
        ? `${descricao} (${cartao_vinculado})`
        : descricao

      const { rows: [divida] } = await pool.query(`
        INSERT INTO dividas (descricao, tipo, valor_total, num_parcelas, valor_parcela, data_inicio, data_termino, categoria_id, forma_pagamento)
        VALUES ($1, 'parcelamento', $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [descDiv, valorTotal, numParc, valorUnit, dataInicio, dataTerminoStr, categoria_id || null, formaDiv])

      for (let i = 0; i < numParc; i++) {
        const d = new Date(dataInicio + 'T12:00:00Z')
        d.setUTCMonth(d.getUTCMonth() + i)
        await pool.query(
          `INSERT INTO parcelas_divida (divida_id, numero_parcela, valor, data_vencimento) VALUES ($1,$2,$3,$4)`,
          [divida.id, i + 1, valorUnit, d.toISOString().split('T')[0]]
        )
      }
    }

    res.status(201).json(conta)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// PUT /api/contas/:id
router.put('/:id', async (req, res) => {
  const { descricao, valor, dia_vencimento, status, categoria_id, forma_pagamento, num_parcelas, tipo_pagamento } = req.body
  const dbStatus = ['paga', 'pendente', 'atrasada'].includes(status) ? status : 'pendente'

  try {
    const { rows } = await pool.query(`
      UPDATE contas
      SET descricao=$1, valor=$2, dia_vencimento=$3, status=$4, categoria_id=$5,
          forma_pagamento=$6, num_parcelas=$7, tipo_pagamento=$8
      WHERE id=$9 AND recorrente = false RETURNING *
    `, [descricao, valor, dia_vencimento, dbStatus, categoria_id || null,
        forma_pagamento || null, num_parcelas || null, tipo_pagamento || null, req.params.id])

    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// PATCH /api/contas/:id/pagar
router.patch('/:id/pagar', async (req, res) => {
  const { data_pagamento } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE contas SET status='paga', data_pagamento=$1 WHERE id=$2 RETURNING *`,
      [data_pagamento || new Date().toISOString().split('T')[0], req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// DELETE /api/contas/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM contas WHERE id=$1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Não encontrado' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
