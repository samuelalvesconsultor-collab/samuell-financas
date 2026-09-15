import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getGastos, criarGasto, deletarGasto } from '../api/gastos'
import Modal from '../components/Modal'
import FormGasto from '../components/FormGasto'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import FABButton from '../components/FABButton'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const BRL_CAT = {
  comida: 'Comida', mercado: 'Mercado', farmacia: 'Farmácia',
  compras_necessarias: 'Compras necessárias', combustivel: 'Combustível', gastos_extras: 'Gastos extras',
}
const BRL_FORMA = { credito: 'Crédito', debito: 'Débito', pix: 'PIX', dinheiro: 'Dinheiro' }

const CAT_CORES = {
  comida: '#f97316', mercado: '#22c55e', farmacia: '#60a5fa',
  compras_necessarias: '#a78bfa', combustivel: '#facc15', gastos_extras: '#f87171',
}

const fmtData = s => {
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

const LARANJA = '#fb923c'
const LARANJA_BG = 'rgba(251,146,60,0.06)'
const LARANJA_BORDER = 'rgba(251,146,60,0.2)'

export default function Gastos() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(false)

  const carregar = () => getGastos(mesSelecionado).then(setLista)

  useEffect(() => { carregar() }, [mesSelecionado])

  useEffect(() => {
    window.addEventListener('gasto-criado', carregar)
    return () => window.removeEventListener('gasto-criado', carregar)
  }, [mesSelecionado])

  async function salvar(dados) {
    await criarGasto({ ...dados, mes: mesSelecionado })
    setModal(false)
    carregar()
    window.dispatchEvent(new CustomEvent('gasto-criado'))
  }

  async function excluir(id) {
    if (!confirm('Excluir gasto?')) return
    await deletarGasto(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  const porCategoria = lista.reduce((acc, g) => {
    const cat = g.categoria || 'gastos_extras'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(g)
    return acc
  }, {})

  const total = lista.reduce((s, g) => s + Number(g.valor), 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Gastos">
        <MonthPicker />
      </PageHeader>

      {lista.length > 0 && (
        <div className="px-4 md:px-8 py-3 md:py-4">
          <div className="rounded-xl px-4 md:px-5 py-4 relative overflow-hidden"
            style={{ background: LARANJA_BG, border: `1px solid ${LARANJA_BORDER}` }}>
            <div className="absolute inset-0 pointer-events-none opacity-5"
              style={{ background: 'radial-gradient(circle at 10% 50%, #fb923c, transparent 60%)' }} />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: LARANJA }}>Total do Mês</p>
                <div className="h-0.5 w-5 rounded-full mb-2" style={{ background: LARANJA }} />
                <p className="font-display text-lg md:text-2xl font-bold tabular-nums"
                  style={{ color: LARANJA, textShadow: '0 0 16px rgba(251,146,60,0.4)' }}>
                  {BRL(total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: LARANJA }}>Registros</p>
                <p className="text-xl md:text-2xl font-bold" style={{ color: LARANJA }}>{lista.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!lista.length ? (
        <div className="text-center py-16 text-gray-600 text-sm px-4">
          <p className="mb-2">Nenhum gasto registrado neste mês.</p>
          <button onClick={() => setModal(true)} style={{ color: LARANJA }}
            className="hover:opacity-80 underline underline-offset-2">
            Registrar agora
          </button>
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-24 space-y-3">
          {Object.entries(porCategoria).map(([cat, itens]) => {
            const corCat = CAT_CORES[cat] || LARANJA
            const totalCat = itens.reduce((s, g) => s + Number(g.valor), 0)
            return (
              <div key={cat} className="rounded-xl overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: corCat }}>
                    {BRL_CAT[cat] || cat}
                  </p>
                  <span className="text-xs font-bold tabular-nums" style={{ color: corCat }}>{BRL(totalCat)}</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                  {itens.map(g => (
                    <div key={g.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{g.descricao}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                            {BRL_FORMA[g.forma_pagamento] || g.forma_pagamento}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{fmtData(g.data)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums" style={{ color: corCat }}>-{BRL(g.valor)}</p>
                        <button onClick={() => excluir(g.id)}
                          className="text-[10px] hover:text-red-400 transition-colors mt-1"
                          style={{ color: 'var(--text-faint)' }}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal titulo="NOVO GASTO" onClose={() => setModal(false)}>
          <FormGasto onSalvar={salvar} onCancelar={() => setModal(false)} />
        </Modal>
      )}

      <FABButton cor={LARANJA} onClick={() => setModal(true)} posicao="center" />
    </div>
  )
}
