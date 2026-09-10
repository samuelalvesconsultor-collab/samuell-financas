import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDashboard } from '../api/dashboard'
import { criarLancamento } from '../api/lancamentos'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import FormLancamento from '../components/FormLancamento'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CORES = ['#dc2626','#0d9488','#d97706','#7c3aed','#0891b2','#be185d','#65a30d','#6b7280']
const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function HealthBadge({ dados }) {
  const critico = dados.saldo < 0 || dados.contas_atrasadas.length > 0
  const atencao = !critico && (dados.contas_proximas.length > 0 || dados.total_contas_pendentes > 0)
  const cfg = critico
    ? { dot: 'bg-red-500',    text: 'text-red-400',   label: 'CRÍTICO'  }
    : atencao
      ? { dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'ATENÇÃO'  }
      : { dot: 'bg-teal-500',   text: 'text-teal-400',   label: 'SAUDÁVEL' }
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  )
}

function MetricCard({ label, valor, cor, sub }) {
  const colors = {
    verde:    { line: '#0d9488', value: '#ffffff' },
    vermelho: { line: '#dc2626', value: '#f87171' },
    amarelo:  { line: '#d97706', value: '#fbbf24' },
    cinza:    { line: '#6b7280', value: '#d1d5db' },
  }
  const c = colors[cor] || colors.cinza
  return (
    <div className="rounded-xl p-4 flex flex-col justify-between"
      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', minHeight: 96 }}>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1.5">{label}</p>
        <div className="h-0.5 w-5 rounded-full mb-2.5" style={{ background: c.line }} />
      </div>
      <div>
        <p className="font-display text-lg font-bold tabular-nums leading-tight" style={{ color: c.value }}>{BRL(valor)}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { mesSelecionado } = useApp()
  const [dados, setDados] = useState(null)
  const [modalLanc, setModalLanc] = useState(false)

  const carregar = () => getDashboard(mesSelecionado).then(setDados)
  useEffect(() => { carregar() }, [mesSelecionado])

  async function salvarLancamento(form) {
    await criarLancamento(form)
    setModalLanc(false)
    carregar()
  }

  const semDados = dados &&
    dados.total_entradas === 0 && dados.total_saidas === 0 &&
    dados.total_contas_pagas === 0 && dados.total_contas_pendentes === 0 &&
    dados.total_parcelas_mes === 0

  return (
    <div className="min-h-screen" style={{ background: '#121212' }}>
      <PageHeader titulo="Dashboard">
        <MonthPicker />
        <button onClick={() => setModalLanc(true)} className="btn-action">
          <span className="text-lg leading-none">+</span> Lançamento
        </button>
      </PageHeader>

      <div className="p-6 space-y-5 max-w-4xl">
        {!dados ? (
          <p className="text-gray-600 text-sm">Carregando...</p>
        ) : semDados ? (
          <div className="rounded-xl p-10 text-center"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-gray-500 text-sm mb-1">Nenhum dado neste mês</p>
            <button onClick={() => setModalLanc(true)} className="text-red-500 text-sm hover:text-red-400 underline underline-offset-2">
              Adicionar lançamento
            </button>
          </div>
        ) : (
          <>
            {/* Barra de status / saldo */}
            <div className="rounded-xl bg-red-600 p-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10">
                <svg width="120" height="80" viewBox="0 0 120 80" fill="white">
                  <circle cx="80" cy="40" r="50" />
                </svg>
              </div>
              <div>
                <p className="text-red-200 text-[10px] uppercase tracking-widest mb-1">Saldo do Mês</p>
                <p className="font-display text-white text-2xl font-bold tabular-nums">{BRL(dados.saldo)}</p>
              </div>
              <HealthBadge dados={dados} />
            </div>

            {/* 4 cards principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label="Entradas do Mês"
                valor={dados.total_entradas}
                cor="verde"
              />
              <MetricCard
                label="Contas Pagas"
                valor={dados.total_contas_pagas}
                cor={dados.total_contas_pagas > 0 ? 'verde' : 'cinza'}
              />
              <MetricCard
                label="Contas Pendentes"
                valor={dados.total_contas_pendentes}
                cor={dados.total_contas_pendentes > 0 ? 'vermelho' : 'cinza'}
              />
              <MetricCard
                label="Total de Parcelas"
                valor={dados.total_parcelas_mes}
                cor={dados.total_parcelas_mes > 0 ? 'amarelo' : 'cinza'}
                sub={dados.qtd_parcelas_mes > 0 ? `${dados.qtd_parcelas_mes} parcela${dados.qtd_parcelas_mes > 1 ? 's' : ''} no mês` : null}
              />
            </div>

            {/* Saídas dos lançamentos */}
            {dados.total_saidas > 0 && (
              <div className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">Saídas (lançamentos)</span>
                <span className="font-display text-red-400 font-bold tabular-nums">{BRL(dados.total_saidas)}</span>
              </div>
            )}

            {/* Alertas: atrasadas */}
            {dados.contas_atrasadas.length > 0 && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <h2 className="text-[10px] font-bold tracking-widest text-red-400 uppercase mb-3">Contas Atrasadas</h2>
                {dados.contas_atrasadas.map(c => (
                  <div key={c.id} className="flex justify-between items-center py-2"
                    style={{ borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
                    <span className="text-sm text-red-200">{c.descricao}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-red-300 tabular-nums">{BRL(c.valor)}</span>
                      <StatusBadge status="atrasada" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alertas: vencendo em breve */}
            {dados.contas_proximas.length > 0 && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}>
                <h2 className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase mb-3">Vencendo em Breve</h2>
                {dados.contas_proximas.map(c => (
                  <div key={c.id} className="flex justify-between items-center py-2"
                    style={{ borderBottom: '1px solid rgba(234,179,8,0.08)' }}>
                    <span className="text-sm text-yellow-200">{c.descricao}</span>
                    <span className="text-sm text-yellow-300 tabular-nums">{BRL(c.valor)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gráfico por categoria */}
            {dados.gastos_por_categoria.length > 0 && (
              <div className="rounded-xl p-5"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-4">Gastos por Categoria</h2>
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dados.gastos_por_categoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={75} stroke="none">
                        {dados.gastos_por_categoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                        formatter={v => BRL(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-[160px] w-full lg:w-auto">
                    {dados.gastos_por_categoria.map((g, i) => (
                      <div key={g.categoria} className="flex justify-between items-center gap-4 text-sm">
                        <span className="flex items-center gap-2 text-gray-400">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CORES[i % CORES.length] }} />
                          {g.categoria || 'Sem categoria'}
                        </span>
                        <span className="font-semibold text-white tabular-nums">{BRL(g.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalLanc && (
        <Modal titulo="NOVO LANÇAMENTO" onClose={() => setModalLanc(false)}>
          <FormLancamento onSalvar={salvarLancamento} onCancelar={() => setModalLanc(false)} />
        </Modal>
      )}
    </div>
  )
}
