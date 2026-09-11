const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /api/contas?mes=YYYY-MM
// Gera automaticamente instâncias do mês para contas recorrentes ativas
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
    // Busca templates recorrentes ativos cujo mês início <= mês solicitado
    const { rows: templates } = await pool.query(`
      SELECT * FROM contas
      WHERE recorrente = true AND conta_pai_id IS NULL
      AND DATE_TRUNC('month', mes_referencia) <= DATE_TRUNC('month', $1::date)
    `, [mesDate])

    // Para cada template, cria instância do mês se não existir
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
            (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente, conta_pai_id)
          VALUES ($1, $2, $3, $4, 'pendente', $5, $6, false, $7)
        `, [t.descricao, t.valor, t.dia_vencimento, mesDate,
            t.categoria_id, t.cartao_vinculado, t.id])
      }
    }

    // Retorna contas do mês (sem templates)
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
// recorrente=true → cria template + instância do mês inicial
router.post('/', async (req, res) => {
  const { descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, recorrente, cartao_vinculado } = req.body
  const isRec = recorrente === true || recorrente === 'true'
  const mesRef = mes_referencia || new Date().toISOString().slice(0, 7) + '-01'

  try {
    if (isRec) {
      // Template recorrente
      const { rows: [tmpl] } = await pool.query(`
        INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente)
        VALUES ($1, $2, $3, $4, 'pendente', $5, $6, true) RETURNING *
      `, [descricao, valor, dia_vencimento, mesRef, categoria_id || null, cartao_vinculado || null])

      // Instância do mês inicial
      const { rows: [inst] } = await pool.query(`
        INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente, conta_pai_id)
        VALUES ($1, $2, $3, $4, 'pendente', $5, $6, false, $7) RETURNING *
      `, [descricao, valor, dia_vencimento, mesRef, categoria_id || null, cartao_vinculado || null, tmpl.id])

      return res.status(201).json(inst)
    }

    const dbStatus = ['paga', 'pendente', 'atrasada'].includes(status) ? status : 'pendente'
    const { rows: [conta] } = await pool.query(`
      INSERT INTO contas (descricao, valor, dia_vencimento, mes_referencia, status, categoria_id, cartao_vinculado, recorrente)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING *
    `, [descricao, valor, dia_vencimento, mesRef, dbStatus, categoria_id || null, cartao_vinculado || null])

    res.status(201).json(conta)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// PUT /api/contas/:id  (só edita instâncias/contas normais, não templates)
router.put('/:id', async (req, res) => {
  const { descricao, valor, dia_vencimento, status, categoria_id } = req.body
  const dbStatus = ['paga', 'pendente', 'atrasada'].includes(status) ? status : 'pendente'

  try {
    const { rows } = await pool.query(`
      UPDATE contas
      SET descricao=$1, valor=$2, dia_vencimento=$3, status=$4, categoria_id=$5
      WHERE id=$6 AND recorrente = false RETURNING *
    `, [descricao, valor, dia_vencimento, dbStatus, categoria_id || null, req.params.id])

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
// Se for template (recorrente=true): cascata remove todas as instâncias
// Se for instância: remove só aquele mês
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
