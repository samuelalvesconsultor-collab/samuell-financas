import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getDashboard } from '../api/dashboard'
import { pagarConta } from '../api/contas'
import { getDividas, registrarParcela } from '../api/dividas'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function CardEntrada({ titulo, valor }) {
  return (
    <div className="rounded-xl p-4 md:p-5 relative overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid rgba(0,230,118,0.2)', boxShadow: '0 0 24px rgba(0,230,118,0.06)' }}>
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 20%, #00e676, transparent 60%)' }} />
      <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">{titulo}</p>
      <p className="font-display text-2xl md:text-3xl font-bold tabular-nums leading-none"
        style={{ color: '#00e676', textShadow: '0 0 20px rgba(0,230,118,0.5)' }}>
        {BRL(valor)}
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-emerald-600 tracking-wide">Receita registrada</span>
      </div>
    </div>
  )
}

function CardPagas({ titulo, valor }) {
  return (
    <div className="rounded-xl p-4 md:p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">{titulo}</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ border: '2px solid #00e676', boxShadow: '0 0 14px rgba(0,230,118,0.35)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-display text-xl md:text-2xl font-bold tabular-nums text-white leading-none">
          {BRL(valor)}
        </p>
      </div>
    </div>
  )
}

function CardPendentes({ titulo, valor }) {
  const temPendente = valor > 0
  return (
    <div className="rounded-xl p-4 md:p-5 relative overflow-hidden"
      style={{
        background: 'var(--card)',
        border: temPendente ? '1px solid rgba(255,23,68,0.25)' : '1px solid var(--card-border)',
        boxShadow: temPendente ? '0 0 24px rgba(255,23,68,0.07)' : 'none',
      }}>
      {temPendente && (
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 20%, #ff1744, transparent 60%)' }} />
      )}
      <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">{titulo}</p>
      <p className="font-display text-2xl md:text-3xl font-bold tabular-nums leading-none"
        style={{ color: temPendente ? '#ff1744' : '#9ca3af', textShadow: temPendente ? '0 0 20px rgba(255,23,68,0.4)' : 'none' }}>
        {BRL(valor)}
      </p>
      {temPendente && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-700 tracking-wide">Pagamento pendente</span>
        </div>
      )}
    </div>
  )
}


const CARD_MAP = {
  entrada_mes:      (titulo, dados) => <CardEntrada key="entrada_mes"      titulo={titulo} valor={dados.total_entradas} />,
  contas_pagas:     (titulo, dados) => <CardPagas   key="contas_pagas"     titulo={titulo} valor={dados.total_contas_pagas} />,
  contas_pendentes: (titulo, dados) => <CardPendentes key="contas_pendentes" titulo={titulo} valor={dados.total_contas_pendentes} />,
}

export default function Dashboard() {
  const { mesSelecionado, config } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [dados, setDados] = useState(null)
  const [dividas, setDividas] = useState([])
  const [pagando, setPagando] = useState(new Set())
  const [pagandoParcela, setPagandoParcela] = useState(new Set())

  const carregar = () => getDashboard(mesSelecionado).then(setDados)
  const carregarDividas = () => getDividas(true).then(list => setDividas(list.filter(d => !d.cartao_id)))
  useEffect(() => { carregar(); carregarDividas() }, [mesSelecionado, location.key])

  async function pagarParcelaDivida(d) {
    setPagandoParcela(s => new Set([...s, d.id]))
    try {
      await registrarParcela(d.id)
      await Promise.all([carregar(), carregarDividas()])
    } finally {
      setPagandoParcela(s => { const n = new Set(s); n.delete(d.id); return n })
    }
  }

  async function marcarContaPaga(conta) {
    setPagando(s => new Set([...s, conta.id]))
    const hoje = new Date().toISOString().split('T')[0]
    const mesRef = (mesSelecionado || hoje.slice(0, 7)) + '-01'
    await pagarConta(conta.id, hoje, mesRef)
    await carregar()
    setPagando(s => { const n = new Set(s); n.delete(conta.id); return n })
  }

  const semDados = dados &&
    dados.total_entradas === 0 && dados.total_contas_pagas === 0 && dados.total_contas_pendentes === 0

  const cardsVisiveis = (config.dashboard_cards || [])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .filter(c => c.visivel)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Dashboard">
        <MonthPicker />
      </PageHeader>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 w-full">
        {!dados ? (
          <p className="text-gray-600 text-sm">Carregando...</p>
        ) : semDados ? (
          <div className="rounded-xl p-10 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <p className="text-gray-500 text-sm mb-1">Nenhum dado neste mês</p>
            <button onClick={() => navigate('/lancamentos')}
              className="text-red-500 text-sm hover:text-red-400 underline underline-offset-2">
              Adicionar lançamento
            </button>
          </div>
        ) : (
          <>
            {cardsVisiveis.length > 0 && (
              <div className={`grid grid-cols-1 gap-3 ${cardsVisiveis.length === 1 ? 'sm:grid-cols-1' : cardsVisiveis.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                {cardsVisiveis.map(c => CARD_MAP[c.id] ? CARD_MAP[c.id](c.titulo, dados) : null)}
              </div>
            )}

            {dados.contas_atrasadas.length > 0 && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.2)' }}>
                <h2 className="text-[10px] font-bold tracking-widest text-red-400 uppercase mb-3">Contas Atrasadas</h2>
                <div className="space-y-1">
                  {dados.contas_atrasadas.map(c => (
                    <div key={c.id} className="flex justify-between items-center py-2"
                      style={{ borderBottom: '1px solid rgba(255,23,68,0.08)' }}>
                      <span className="text-sm text-red-200 truncate pr-3">{c.descricao}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-red-300 tabular-nums">{BRL(c.valor)}</span>
                        <StatusBadge status="atrasada" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Lista unificada de pagamentos pendentes ── */}
            {(() => {
              const hoje = new Date()
              const mesHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
              const mesFiltro = mesSelecionado || mesHoje
              const itensDividas = dividas.filter(d => d.ativa).map(d => {
                const mesProxVenc = d.proxima_vencimento ? d.proxima_vencimento.slice(0, 7) : null
                const jaPagou = (d.parcelas_pagas || 0) > 0 && (mesProxVenc === null || mesProxVenc > mesFiltro)
                const temPendente = (d.parcelas_pagas || 0) < d.num_parcelas
                return { tipo: 'divida', d, jaPagou, temPendente }
              })
              const itensContas = dados.contas_proximas.filter(c => !c.cartao_vinculado).map(c => ({ tipo: 'conta', c }))
              const todos = [...itensContas, ...itensDividas]
              if (!todos.length) return null
              return (
                <div className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                  <div className="px-4 pt-3 pb-1">
                    <h2 className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(234,179,8,0.8)' }}>Pagamentos Pendentes</h2>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                    {itensContas.map(({ c }) => (
                      <div key={`c-${c.id}`} className="flex items-center justify-between px-4 py-3">
                        <p className="text-sm text-white truncate flex-1 pr-3">{c.descricao}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm tabular-nums font-semibold" style={{ color: 'rgba(255,23,68,0.8)' }}>-{BRL(c.valor)}</span>
                          <button onClick={() => marcarContaPaga(c)} disabled={pagando.has(c.id)}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                            {pagando.has(c.id) ? '...' : 'Pagar'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {itensDividas.map(({ d, jaPagou, temPendente }) => (
                      <div key={`d-${d.id}`} className="flex items-center justify-between px-4 py-3">
                        <p className="text-sm text-white truncate flex-1 pr-3">{d.descricao}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm tabular-nums font-semibold" style={{ color: jaPagou ? '#22c55e' : 'rgba(255,23,68,0.8)' }}>
                            -{BRL(d.valor_parcela)}
                          </span>
                          {jaPagou ? (
                            <span className="text-[10px] font-semibold text-green-500">Pago</span>
                          ) : temPendente ? (
                            <button onClick={() => pagarParcelaDivida(d)} disabled={pagandoParcela.has(d.id)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                              {pagandoParcela.has(d.id) ? '...' : 'Pagar'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-600">Quitado</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}


          </>
        )}
      </div>

    </div>
  )
}
