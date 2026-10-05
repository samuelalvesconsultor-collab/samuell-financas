import { useState, useEffect, useRef } from 'react'
import { getParcelas, pagarParcela, registrarParcela, estornarParcela } from '../api/dividas'
import CategoryBadge from './CategoryBadge'

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

export const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtDateDivida = s => {
  if (!s) return '—'
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
)

const TIPO_DIVIDA_LABEL = { cartao: 'Cartão', financiamento: 'Financiamento', emprestimo: 'Empréstimo', parcelamento: 'Parcelamento' }

function Parcelas({ divida, onPagar }) {
  const [parcelas, setParcelas] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [estornando, setEstornando] = useState(null)

  const recarregar = () => getParcelas(divida.id).then(setParcelas)

  useEffect(() => { recarregar() }, [divida.id])

  async function pagar(p) {
    await pagarParcela(p.id, new Date().toISOString().split('T')[0])
    setConfirmando(null)
    recarregar()
    onPagar()
  }

  async function estornar(p) {
    await estornarParcela(p.id)
    setEstornando(null)
    recarregar()
    onPagar()
  }

  if (!parcelas) return <div className="text-gray-600 text-xs py-2">Carregando parcelas...</div>

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">Parcelas</p>
        <p className="text-xs text-gray-500">
          Saldo devedor: <span className="text-red-400 font-semibold tabular-nums">{BRL(divida.saldo_devedor)}</span>
        </p>
      </div>
      <div className="space-y-1.5">
        {parcelas.map(p => {
          const paga = p.status === 'paga'
          return (
            <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
              style={{
                background: paga ? 'rgba(34,197,94,0.06)' : 'var(--card-highlight)',
                border: `1px solid ${paga ? 'rgba(34,197,94,0.2)' : 'var(--divider)'}`,
              }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] tabular-nums w-4" style={{ color: paga ? '#4ade80' : 'var(--text-faint)' }}>
                  #{p.numero_parcela}
                </span>
                <span className="text-xs" style={{ color: paga ? '#86efac' : 'var(--text-muted)' }}>
                  {fmtDateDivida(p.data_vencimento)}
                </span>
                <span className="text-xs tabular-nums font-medium" style={{ color: paga ? '#4ade80' : 'var(--text)' }}>
                  {BRL(p.valor)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {paga ? (
                  estornando === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">Desfazer?</span>
                      <button onClick={() => estornar(p)} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Sim</button>
                      <button onClick={() => setEstornando(null)} className="text-[10px] text-gray-600 hover:text-gray-400">Não</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-green-400">Paga</span>
                      <button onClick={() => setEstornando(p.id)}
                        className="text-[11px] text-gray-600 hover:text-red-400 transition-colors leading-none">
                        ×
                      </button>
                    </div>
                  )
                ) : confirmando === p.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Confirmar?</span>
                    <button onClick={() => pagar(p)} className="text-xs text-teal-400 hover:text-teal-300 font-medium">Sim</button>
                    <button onClick={() => setConfirmando(null)} className="text-xs text-gray-600 hover:text-gray-400">Não</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmando(p.id)} className="text-xs text-teal-500 hover:text-teal-400 transition-colors">Pagar</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DividaCard({
  divida, onEdit, onDelete, onRefresh,
  idx = 0, dragOver = null,
  onDragStart = () => {}, onDragOver = () => {}, onDrop = () => {}, onDragEnd = () => {},
}) {
  const [expandido, setExpandido] = useState(false)
  const [confirmandoPagar, setConfirmandoPagar] = useState(false)
  const [pagando, setPagando] = useState(false)
  const dragFromGrip = useRef(false)

  const progresso = divida.num_parcelas > 0 ? ((divida.parcelas_pagas || 0) / divida.num_parcelas) * 100 : 0
  const isOver = dragOver === idx
  const temPendente = divida.ativa && (divida.parcelas_pagas || 0) < divida.num_parcelas

  const hoje = new Date()
  const mesHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const mesProxVenc = divida.proxima_vencimento ? divida.proxima_vencimento.slice(0, 7) : null
  const mesPago = divida.parcelas_pagas > 0 && (mesProxVenc === null || mesProxVenc > mesHoje)

  async function pagarMes(e) {
    e.stopPropagation()
    setPagando(true)
    try {
      await registrarParcela(divida.id)
      setConfirmandoPagar(false)
      onRefresh()
    } finally {
      setPagando(false)
    }
  }

  return (
    <div
      draggable
      onDragStart={e => {
        if (!dragFromGrip.current) { e.preventDefault(); return }
        dragFromGrip.current = false
        onDragStart(idx)
      }}
      onDragOver={e => { e.preventDefault(); onDragOver(idx) }}
      onDrop={() => onDrop(idx)}
      onDragEnd={onDragEnd}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--card)',
        border: `1px solid ${isOver ? 'rgba(220,38,38,0.6)' : 'var(--card-border)'}`,
        boxShadow: isOver ? '0 0 0 2px rgba(220,38,38,0.2)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium truncate">{divida.descricao}</p>
              <span
                style={{ color: 'var(--text-faint)', flexShrink: 0, cursor: 'grab' }}
                onMouseDown={() => { dragFromGrip.current = true }}
                onMouseLeave={() => { dragFromGrip.current = false }}
              >
                <GripIcon />
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wide">{TIPO_DIVIDA_LABEL[divida.tipo]}</span>
              {divida.categoria_nome && <CategoryBadge nome={divida.categoria_nome} />}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Parcela</p>
            <p className="font-bold tabular-nums" style={mesPago
              ? { color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.35)' }
              : { color: 'var(--text)' }}>
              {BRL(divida.valor_parcela)}
            </p>
            {divida.proxima_vencimento && (
              <p className="text-[10px] text-gray-600 mt-0.5">vence {fmtDateDivida(divida.proxima_vencimento)}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
            <span>{divida.parcelas_pagas || 0} de {divida.num_parcelas} parcelas</span>
            <span>{Math.max(0, divida.num_parcelas - (divida.parcelas_pagas || 0))} restantes</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--progress-track)' }}>
            <div className="h-1.5 rounded-full bg-red-600 transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        {Number(divida.saldo_devedor) > 0 && (
          <div className="flex justify-end mt-2">
            <span className="text-[10px] tabular-nums" style={{ color: 'rgba(239,68,68,0.55)' }}>
              saldo devedor {BRL(divida.saldo_devedor)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
          <button onClick={() => setExpandido(e => !e)}
            className="text-xs text-gray-500 hover:text-gray-200 transition-colors flex items-center gap-1"
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            {expandido ? '▲' : '▼'} {expandido ? 'Ocultar' : 'Ver'} parcelas
          </button>

          {temPendente && (
            confirmandoPagar ? (
              <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                <span className="text-[11px] text-gray-400">Confirmar?</span>
                <button onClick={pagarMes} disabled={pagando}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                  {pagando ? '...' : 'Sim'}
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirmandoPagar(false) }}
                  className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Não</button>
              </div>
            ) : (
              <button onClick={e => { e.stopPropagation(); setConfirmandoPagar(true) }}
                className="text-xs text-teal-600 hover:text-teal-400 transition-colors"
                onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                Pagar mês
              </button>
            )
          )}

          <button onClick={onEdit} className="text-gray-600 hover:text-gray-300 transition-colors ml-auto"
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} title="Editar">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>Excluir</button>
        </div>
      </div>

      {expandido && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--divider)' }}>
          <Parcelas divida={divida} onPagar={onRefresh} />
        </div>
      )}
    </div>
  )
}
