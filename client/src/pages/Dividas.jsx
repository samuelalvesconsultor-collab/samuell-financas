import { useEffect, useRef, useState } from 'react'
import { getDividas, criarDivida, atualizarDivida, deletarDivida, getParcelas, pagarParcela, registrarParcela } from '../api/dividas'
import { getConfiguracoes, patchConfiguracao } from '../api/configuracoes'
import Modal from '../components/Modal'
import FormDivida from '../components/FormDivida'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import PageHeader from '../components/PageHeader'
import FABButton from '../components/FABButton'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = s => { if (!s) return '—'; const d = new Date(s); d.setMinutes(d.getMinutes()+d.getTimezoneOffset()); return d.toLocaleDateString('pt-BR') }
const TIPO_LABEL = { cartao: 'Cartão', financiamento: 'Financiamento', emprestimo: 'Empréstimo', parcelamento: 'Parcelamento' }

const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
)

// Aplica ordem salva por IDs; dívidas novas vão para o final
function aplicarOrdem(lista, ordemIds) {
  if (!ordemIds || !ordemIds.length) return lista
  const posMap = new Map(ordemIds.map((id, i) => [id, i]))
  return [...lista].sort((a, b) => {
    const ai = posMap.has(a.id) ? posMap.get(a.id) : 9999
    const bi = posMap.has(b.id) ? posMap.get(b.id) : 9999
    return ai - bi
  })
}

function Parcelas({ divida, onPagar }) {
  const [parcelas, setParcelas] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => { getParcelas(divida.id).then(setParcelas) }, [divida.id])

  async function pagar(p) {
    await pagarParcela(p.id, new Date().toISOString().split('T')[0])
    setConfirmando(null)
    getParcelas(divida.id).then(setParcelas)
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
        {parcelas.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
            style={{ background: 'var(--card-highlight)', border: '1px solid var(--divider)' }}>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-600 tabular-nums w-4">#{p.numero_parcela}</span>
              <span className="text-xs text-gray-400">{fmtDate(p.data_vencimento)}</span>
              <span className="text-xs text-white tabular-nums font-medium">{BRL(p.valor)}</span>
            </div>
            <div className="flex items-center gap-3">
              {p.status === 'paga'
                ? <StatusBadge status="paga" />
                : confirmando === p.id
                  ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Confirmar?</span>
                      <button onClick={() => pagar(p)} className="text-xs text-teal-400 hover:text-teal-300 font-medium">Sim</button>
                      <button onClick={() => setConfirmando(null)} className="text-xs text-gray-600 hover:text-gray-400">Não</button>
                    </div>
                  )
                  : <button onClick={() => setConfirmando(p.id)} className="text-xs text-teal-500 hover:text-teal-400 transition-colors">Pagar</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DividaCard({ divida, onEdit, onDelete, onRefresh, idx, dragOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const [expandido, setExpandido] = useState(false)
  const [confirmandoPagar, setConfirmandoPagar] = useState(false)
  const [pagando, setPagando] = useState(false)

  const progresso = divida.num_parcelas > 0 ? ((divida.parcelas_pagas || 0) / divida.num_parcelas) * 100 : 0
  const isOver = dragOver === idx
  const temPendente = divida.ativa && (divida.parcelas_pagas || 0) < divida.num_parcelas

  // Verde quando o mês atual já foi pago — volta ao branco quando vira o mês
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
      onDragStart={() => onDragStart(idx)}
      onDragOver={e => { e.preventDefault(); onDragOver(idx) }}
      onDrop={() => onDrop(idx)}
      onDragEnd={onDragEnd}
      className="rounded-xl overflow-hidden transition-all duration-150"
      style={{
        background: 'var(--card)',
        border: `1px solid ${isOver ? 'rgba(220,38,38,0.6)' : 'var(--card-border)'}`,
        boxShadow: isOver ? '0 0 0 2px rgba(220,38,38,0.2)' : 'none',
        cursor: 'grab',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium truncate">{divida.descricao}</p>
              <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}><GripIcon /></span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wide">{TIPO_LABEL[divida.tipo]}</span>
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
              <p className="text-[10px] text-gray-600 mt-0.5">vence {fmtDate(divida.proxima_vencimento)}</p>
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

        {/* Saldo devedor discreto */}
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

          <button onClick={onEdit} className="text-xs text-gray-600 hover:text-gray-300 transition-colors ml-auto"
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>Editar</button>
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

export default function Dividas() {
  const [lista, setLista]             = useState([])
  const [modal, setModal]             = useState(null)
  const [filtroAtiva, setFiltroAtiva] = useState('true')
  const [dragOver, setDragOver]       = useState(null)
  const dragIdx    = useRef(null)
  const ordemSalva = useRef([])

  const chaveConfig = `ordem_dividas_${filtroAtiva}`

  const carregar = async () => {
    let data
    if (filtroAtiva === '') {
      const [a, i] = await Promise.all([getDividas(true), getDividas(false)])
      data = [...a, ...i]
    } else {
      data = await getDividas(filtroAtiva === 'true')
    }
    const cfg = await getConfiguracoes()
    const ordem = cfg[chaveConfig] ?? []
    ordemSalva.current = ordem
    setLista(aplicarOrdem(data, ordem))
  }
  useEffect(() => { carregar() }, [filtroAtiva])

  function salvarOrdem(novaLista) {
    const ordem = novaLista.map(d => d.id)
    ordemSalva.current = ordem
    patchConfiguracao(chaveConfig, JSON.stringify(ordem))
  }

  function onDragStart(i) { dragIdx.current = i }
  function onDragOver(i)  { setDragOver(i) }
  function onDrop(i) {
    if (dragIdx.current === null || dragIdx.current === i) { dragIdx.current = null; setDragOver(null); return }
    setLista(l => {
      const next = [...l]
      const [moved] = next.splice(dragIdx.current, 1)
      next.splice(i, 0, moved)
      salvarOrdem(next)
      return next
    })
    dragIdx.current = null
    setDragOver(null)
  }
  function onDragEnd() { dragIdx.current = null; setDragOver(null) }

  async function salvar(dados) {
    if (modal === 'novo') await criarDivida(dados)
    else await atualizarDivida(modal.id, dados)
    setModal(null); carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir dívida e todas as parcelas?')) return
    await deletarDivida(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  const totalMensal = lista.filter(d => d.ativa).reduce((s, d) => s + Number(d.valor_parcela), 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Dívidas">
        <select value={filtroAtiva} onChange={e => setFiltroAtiva(e.target.value)} className="select-dark !w-auto text-xs md:text-sm">
          <option value="true">Ativas</option>
          <option value="false">Quitadas</option>
          <option value="">Todas</option>
        </select>
      </PageHeader>

      {filtroAtiva === 'true' && totalMensal > 0 && (
        <div className="mx-4 md:mx-8 mt-4 rounded-xl px-5 py-4 flex justify-between items-center"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Comprometimento mensal</span>
          <span className="font-display font-bold text-red-400 tabular-nums">{BRL(totalMensal)}</span>
        </div>
      )}

      <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {!lista.length
          ? <div className="text-center py-16 text-gray-600 text-sm">Nenhuma dívida encontrada.</div>
          : lista.map((d, idx) => (
              <DividaCard
                key={d.id}
                divida={d}
                idx={idx}
                dragOver={dragOver}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onEdit={() => setModal(d)}
                onDelete={() => excluir(d.id)}
                onRefresh={carregar}
              />
            ))
        }
      </div>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA DÍVIDA' : 'EDITAR DÍVIDA'} onClose={() => setModal(null)}>
          <FormDivida inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}

      <FABButton cor="#ef4444" onClick={() => setModal('novo')} posicao="center" />
    </div>
  )
}
