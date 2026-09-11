import { useEffect, useState } from 'react'
import { getDividas, criarDivida, atualizarDivida, deletarDivida, getParcelas, pagarParcela } from '../api/dividas'
import Modal from '../components/Modal'
import FormDivida from '../components/FormDivida'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import PageHeader from '../components/PageHeader'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = s => { if (!s) return '—'; const d = new Date(s); d.setMinutes(d.getMinutes()+d.getTimezoneOffset()); return d.toLocaleDateString('pt-BR') }
const TIPO_LABEL = { cartao: 'Cartão', financiamento: 'Financiamento', emprestimo: 'Empréstimo', parcelamento: 'Parcelamento' }

function Parcelas({ divida, onPagar }) {
  const [parcelas, setParcelas] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => {
    getParcelas(divida.id).then(setParcelas)
  }, [divida.id])

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
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
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

function DividaCard({ divida, onEdit, onDelete, onRefresh }) {
  const [expandido, setExpandido] = useState(false)
  const progresso = divida.num_parcelas > 0 ? ((divida.parcelas_pagas || 0) / divida.num_parcelas) * 100 : 0

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header da dívida */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-white font-medium">{divida.descricao}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wide">{TIPO_LABEL[divida.tipo]}</span>
              {divida.categoria_nome && <CategoryBadge nome={divida.categoria_nome} />}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Parcela</p>
            <p className="text-white font-bold tabular-nums">{BRL(divida.valor_parcela)}</p>
            {divida.proxima_vencimento && (
              <p className="text-[10px] text-gray-600 mt-0.5">vence {fmtDate(divida.proxima_vencimento)}</p>
            )}
          </div>
        </div>

        {/* Progresso */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
            <span>{divida.parcelas_pagas || 0} de {divida.num_parcelas} parcelas</span>
            <span>{Math.max(0, divida.num_parcelas - (divida.parcelas_pagas || 0))} restantes</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-1.5 rounded-full bg-red-600 transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={() => setExpandido(e => !e)}
            className="text-xs text-gray-500 hover:text-gray-200 transition-colors flex items-center gap-1">
            {expandido ? '▲' : '▼'} {expandido ? 'Ocultar' : 'Ver'} parcelas
          </button>
          <button onClick={onEdit} className="text-xs text-gray-600 hover:text-gray-300 transition-colors ml-auto">Editar</button>
          <button onClick={onDelete} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Excluir</button>
        </div>
      </div>

      {/* Parcelas expandidas */}
      {expandido && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Parcelas divida={divida} onPagar={onRefresh} />
        </div>
      )}
    </div>
  )
}

export default function Dividas() {
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [filtroAtiva, setFiltroAtiva] = useState('true')

  const carregar = async () => {
    if (filtroAtiva === '') {
      const [a, i] = await Promise.all([getDividas(true), getDividas(false)])
      setLista([...a, ...i])
    } else {
      setLista(await getDividas(filtroAtiva === 'true'))
    }
  }
  useEffect(() => { carregar() }, [filtroAtiva])

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
    <div className="min-h-screen" style={{ background: '#121212' }}>
      <PageHeader titulo="Dívidas">
        <select value={filtroAtiva} onChange={e => setFiltroAtiva(e.target.value)} className="select-dark !w-auto text-xs md:text-sm">
          <option value="true">Ativas</option>
          <option value="false">Quitadas</option>
          <option value="">Todas</option>
        </select>
        <button onClick={() => setModal('novo')} className="btn-action text-xs md:text-sm px-3 md:px-4">
          <span className="text-base md:text-lg leading-none">+</span>
          <span className="hidden sm:inline">Nova</span>
        </button>
      </PageHeader>

      {filtroAtiva === 'true' && totalMensal > 0 && (
        <div className="mx-6 mt-4 rounded-xl px-5 py-4 flex justify-between items-center"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Comprometimento mensal</span>
          <span className="font-display font-bold text-red-400 tabular-nums">{BRL(totalMensal)}</span>
        </div>
      )}

      <div className="p-6 space-y-3">
        {!lista.length
          ? <div className="text-center py-16 text-gray-600 text-sm">Nenhuma dívida encontrada.</div>
          : lista.map(d => (
              <DividaCard
                key={d.id}
                divida={d}
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
    </div>
  )
}
