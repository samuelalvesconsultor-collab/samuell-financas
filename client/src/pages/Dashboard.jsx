import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getDashboard } from '../api/dashboard'
import { pagarConta, atualizarConta } from '../api/contas'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import FormConta from '../components/FormConta'
import StatusBadge from '../components/StatusBadge'
import FAB from '../components/FAB'
const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const mesLabel = s => MESES_PT[parseInt(s.split('-')[1]) - 1]

const fmtVencimento = c => {
  const d = new Date(c.mes_referencia)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), c.dia_vencimento))
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

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
  const [dados, setDados] = useState(null)
  const [editConta, setEditConta] = useState(null)
  const [pagando, setPagando] = useState(new Set())

  const carregar = () => getDashboard(mesSelecionado).then(setDados)
  useEffect(() => { carregar() }, [mesSelecionado])

  async function marcarContaPaga(conta) {
    setPagando(s => new Set([...s, conta.id]))
    await pagarConta(conta.id, new Date().toISOString().split('T')[0])
    await carregar()
    setPagando(s => { const n = new Set(s); n.delete(conta.id); return n })
  }

  async function salvarEdicaoConta(form) {
    await atualizarConta(editConta.id, form)
    setEditConta(null)
    carregar()
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

            {dados.contas_proximas.length > 0 && (
              <div className="card-contas-abertas rounded-xl p-4"
                style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.18)' }}>
                <h2 className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase mb-3">Contas em Aberto</h2>
                <div className="space-y-0.5">
                  {dados.contas_proximas.map(c => (
                    <div key={c.id} className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: '1px solid rgba(234,179,8,0.06)' }}>
                      <button
                        onClick={() => marcarContaPaga(c)}
                        disabled={pagando.has(c.id)}
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors"
                        style={{ border: '1.5px solid rgba(234,179,8,0.4)', background: pagando.has(c.id) ? 'rgba(0,230,118,0.15)' : 'transparent' }}
                        title="Marcar como pago">
                        {pagando.has(c.id) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-yellow-100 truncate">{c.descricao}</p>
                        <p className="text-[10px] text-yellow-700 mt-0.5">Vence {fmtVencimento(c)}</p>
                      </div>
                      <span className="text-sm text-yellow-300 tabular-nums shrink-0">{BRL(c.valor)}</span>
                      <button onClick={() => setEditConta(c)}
                        className="text-gray-600 hover:text-gray-300 shrink-0 transition-colors"
                        title="Editar conta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {editConta && (
        <Modal titulo="EDITAR CONTA" onClose={() => setEditConta(null)}>
          <FormConta inicial={editConta} onSalvar={salvarEdicaoConta} onCancelar={() => setEditConta(null)} />
        </Modal>
      )}

      <FAB />
    </div>
  )
}
