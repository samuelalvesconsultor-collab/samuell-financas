const express = require('express')
const router = express.Router()
const pool = require('../db')

// PATCH /api/parcelas/:id/pagar — quita uma parcela específica + cria lançamento
router.patch('/:id/pagar', async (req, res) => {
  // 1. Buscar parcela
  const { rows: [parcela] } = await pool.query(
    `SELECT p.*, d.descricao as divida_descricao, d.categoria_id, d.id as divida_id
     FROM parcelas_divida p JOIN dividas d ON d.id = p.divida_id WHERE p.id = $1`,
    [req.params.id]
  )
  if (!parcela) return res.status(404).json({ error: 'Parcela não encontrada' })
  if (parcela.status === 'paga') return res.status(400).json({ error: 'Parcela já paga' })

  const data_pagamento = req.body.data_pagamento || new Date().toISOString().split('T')[0]

  // 2. Marcar parcela como paga
  await pool.query(
    `UPDATE parcelas_divida SET status='paga', data_pagamento=$1 WHERE id=$2`,
    [data_pagamento, parcela.id]
  )

  // 3. Criar lançamento correspondente
  const descLancamento = `${parcela.divida_descricao} — parcela ${parcela.numero_parcela}`
  await pool.query(
    `INSERT INTO lancamentos (descricao, valor, data, tipo, status, categoria_id)
     VALUES ($1, $2, $3, 'saida', 'pago', $4)`,
    [descLancamento, parcela.valor, data_pagamento, parcela.categoria_id]
  )

  // 4. Verificar se todas as parcelas foram pagas → quitar dívida
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) as count FROM parcelas_divida WHERE divida_id=$1 AND status='pendente'`,
    [parcela.divida_id]
  )
  if (count === '0') {
    await pool.query(`UPDATE dividas SET ativa=false WHERE id=$1`, [parcela.divida_id])
  }

  res.json({ ok: true, parcela_id: parcela.id })
})

module.exports = router
