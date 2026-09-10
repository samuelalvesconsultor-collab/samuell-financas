const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7)
  const mesDate = `${mes}-01`

  const [
    entradas, saidas,
    contasPagas, contasPendentes,
    parcelasMes,
    contasProximas, contasAtrasadas,
    gastosCat,
  ] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos
       WHERE tipo='entrada' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)`,
      [mesDate]
    ),
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos
       WHERE tipo='saida' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)`,
      [mesDate]
    ),
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM contas
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status = 'paga'`,
      [mesDate]
    ),
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM contas
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status IN ('pendente', 'atrasada')`,
      [mesDate]
    ),
    pool.query(
      `SELECT COALESCE(SUM(p.valor), 0) as total, COUNT(*) as quantidade
       FROM parcelas_divida p
       WHERE DATE_TRUNC('month', p.data_vencimento) = DATE_TRUNC('month', $1::date)`,
      [mesDate]
    ),
    pool.query(
      `SELECT c.*, cat.nome as categoria_nome FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status='pendente'
       AND (MAKE_DATE(EXTRACT(YEAR FROM mes_referencia)::int, EXTRACT(MONTH FROM mes_referencia)::int, dia_vencimento))
           BETWEEN CURRENT_DATE AND CURRENT_DATE + 7`,
      [mesDate]
    ),
    pool.query(
      `SELECT c.*, cat.nome as categoria_nome FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status='atrasada'`,
      [mesDate]
    ),
    pool.query(
      `SELECT cat.nome as categoria, COALESCE(SUM(l.valor), 0) as total
       FROM lancamentos l
       LEFT JOIN categorias cat ON l.categoria_id = cat.id
       WHERE l.tipo='saida' AND DATE_TRUNC('month', l.data) = DATE_TRUNC('month', $1::date)
       GROUP BY cat.nome ORDER BY total DESC`,
      [mesDate]
    ),
  ])

  const total_entradas    = parseFloat(entradas.rows[0].total)
  const total_saidas      = parseFloat(saidas.rows[0].total)
  const total_contas_pagas    = parseFloat(contasPagas.rows[0].total)
  const total_contas_pendentes = parseFloat(contasPendentes.rows[0].total)
  const total_parcelas_mes    = parseFloat(parcelasMes.rows[0].total)
  const qtd_parcelas_mes      = parseInt(parcelasMes.rows[0].quantidade)

  res.json({
    total_entradas,
    total_saidas,
    saldo: total_entradas - total_saidas,
    total_contas_pagas,
    total_contas_pendentes,
    total_parcelas_mes,
    qtd_parcelas_mes,
    contas_proximas: contasProximas.rows,
    contas_atrasadas: contasAtrasadas.rows,
    gastos_por_categoria: gastosCat.rows,
  })
})

module.exports = router
