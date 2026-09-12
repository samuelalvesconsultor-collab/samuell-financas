const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7)
  const mesDate = `${mes}-01`

  const [
    entradas, contasPagas, contasPendentes,
    contasProximas, contasAtrasadas,
    historicoEntradas, historicoSaidas,
  ] = await Promise.all([
    // Entradas do mês (lançamentos)
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos
       WHERE tipo='entrada' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)`,
      [mesDate]
    ),
    // Contas pagas no mês (exclui templates recorrentes)
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM contas
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status = 'paga' AND recorrente = false`,
      [mesDate]
    ),
    // Contas pendentes/atrasadas no mês (exclui templates)
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM contas
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status IN ('pendente', 'atrasada') AND recorrente = false`,
      [mesDate]
    ),
    // Contas em aberto: pendentes do mês + templates recorrentes sem instância paga/pendente no mês
    pool.query(
      `SELECT c.id, c.descricao, c.valor, c.dia_vencimento, c.mes_referencia,
              c.status, c.categoria_id, c.recorrente, c.conta_pai_id, c.cartao_vinculado,
              cat.nome as categoria_nome
       FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE DATE_TRUNC('month', c.mes_referencia) = DATE_TRUNC('month', $1::date)
         AND c.status = 'pendente' AND c.recorrente = false

       UNION ALL

       SELECT c.id, c.descricao, c.valor, c.dia_vencimento, $1::date as mes_referencia,
              'pendente' as status, c.categoria_id, true as recorrente, null as conta_pai_id, c.cartao_vinculado,
              cat.nome as categoria_nome
       FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE c.recorrente = true AND c.conta_pai_id IS NULL
         AND DATE_TRUNC('month', c.mes_referencia) <= DATE_TRUNC('month', $1::date)
         AND NOT EXISTS (
           SELECT 1 FROM contas inst
           WHERE inst.conta_pai_id = c.id
             AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $1::date)
             AND inst.status IN ('paga', 'pendente')
         )

       ORDER BY dia_vencimento ASC`,
      [mesDate]
    ),
    // Contas atrasadas (exclui templates)
    pool.query(
      `SELECT c.*, cat.nome as categoria_nome FROM contas c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $1::date)
       AND status='atrasada' AND c.recorrente = false`,
      [mesDate]
    ),
    // Histórico mensal de entradas (últimos 6 meses)
    pool.query(
      `SELECT TO_CHAR(m.mes, 'YYYY-MM') as mes,
              COALESCE(SUM(l.valor::numeric), 0) as total
       FROM generate_series(
         DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
         DATE_TRUNC('month', NOW()),
         '1 month'::interval
       ) as m(mes)
       LEFT JOIN lancamentos l
         ON DATE_TRUNC('month', l.data) = m.mes AND l.tipo = 'entrada'
       GROUP BY m.mes ORDER BY m.mes`
    ),
    // Histórico mensal de saídas — contas pagas (últimos 6 meses)
    pool.query(
      `SELECT TO_CHAR(m.mes, 'YYYY-MM') as mes,
              COALESCE(SUM(c.valor::numeric), 0) as total
       FROM generate_series(
         DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
         DATE_TRUNC('month', NOW()),
         '1 month'::interval
       ) as m(mes)
       LEFT JOIN contas c
         ON DATE_TRUNC('month', c.mes_referencia) = m.mes AND c.status = 'paga'
       GROUP BY m.mes ORDER BY m.mes`
    ),
  ])

  // Mescla os dois históricos por mês
  const historicoMap = {}
  historicoEntradas.rows.forEach(r => {
    historicoMap[r.mes] = { mes: r.mes, entradas: parseFloat(r.total), saidas: 0 }
  })
  historicoSaidas.rows.forEach(r => {
    if (historicoMap[r.mes]) historicoMap[r.mes].saidas = parseFloat(r.total)
    else historicoMap[r.mes] = { mes: r.mes, entradas: 0, saidas: parseFloat(r.total) }
  })
  const historico_mensal = Object.values(historicoMap).sort((a, b) => a.mes.localeCompare(b.mes))

  res.json({
    total_entradas:        parseFloat(entradas.rows[0].total),
    total_contas_pagas:    parseFloat(contasPagas.rows[0].total),
    total_contas_pendentes: parseFloat(contasPendentes.rows[0].total),
    contas_proximas:       contasProximas.rows,
    contas_atrasadas:      contasAtrasadas.rows,
    historico_mensal,
  })
})

module.exports = router
