import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getContas, criarConta, atualizarConta, deletarConta, pagarConta } from '../api/contas'
import { getConfiguracoes, patchConfiguracao } from '../api/configuracoes'
import { getDashboard } from '../api/dashboard'
import { getGastos, deletarGasto } from '../api/gastos'
import { CORES_STATUS_DEFAULT, CORES_FORMA_DEFAULT } from '../context/AppContext'
import Modal from '../components/Modal'
import FormConta from '../components/FormConta'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import GraficoMensal from '../components/GraficoMensal'
import FABButton from '../components/FABButton'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const VERM        = '#ff1744'
const VERM_BG     = 'rgba(255,23,68,0.06)'
const VERM_BORDER = 'rgba(255,23,68,0.2)'

function corCategoria(nome, cor) {
  if (cor) return cor
  return '#6b7280'
}

const RecBadge = ({ cartao }) => (
  <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
    {cartao || 'Recorrente'}
  </span>
)

const TIPO_LABEL = { avista: 'À vista', parcelado: 'Parcelado', recorrente: 'Recorrente' }
const FORMA_LABEL = { credito: 'Crédito', boleto: 'Boleto', pix: 'PIX' }

function TipoBadge({ tipo, cores }) {
  const label = TIPO_LABEL[tipo]
  const cor = cores?.[tipo] || CORES_STATUS_DEFAULT[tipo] || '#6b7280'
  if (!label) return null
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
      style={{ background: `${cor}22`, border: `1px solid ${cor}44`, color: cor }}>
      {label}
    </span>
  )
}

function FormaBadge({ forma, cores }) {
  const label = FORMA_LABEL[forma]
  const cor = cores?.[forma] || CORES_FORMA_DEFAULT[forma] || '#6b7280'
  if (!label) return null
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
      style={{ background: `${cor}22`, border: `1px solid ${cor}44`, color: cor }}>
      {label}
    </span>
  )
}

const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
)

function ModalExcluirRec({ conta, onSoMes, onSerie, onCancelar }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        <span className="text-white font-medium">{conta.descricao}</span> é uma conta recorrente.
        O que deseja fazer?
      </p>
      {conta.cartao_vinculado && (
        <div className="rounded-lg px-3 py-2 text-xs"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
          Vinculada ao <span className="text-white font-medium">{conta.cartao_vinculado}</span>
        </div>
      )}
      <div className="space-y-2">
        <button onClick={onSoMes} className="w-full text-left rounded-xl px-4 py-3 text-sm transition-colors"
          style={{ background: 'var(--card-alt)', border: '1px solid var(--card-border)' }}>
          <p className="text-white font-medium">Excluir só este mês</p>
          <p className="text-gray-600 text-xs mt-0.5">Os outros meses continuam sendo gerados normalmente.</p>
        </button>
        <button onClick={onSerie} className="w-full text-left rounded-xl px-4 py-3 text-sm transition-colors"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <p className="text-red-400 font-medium">Cancelar toda a recorrência</p>
          <p className="text-gray-600 text-xs mt-0.5">Remove este e todos os meses futuros. Não pode ser desfeito.</p>
        </button>
      </div>
      <button onClick={onCancelar} className="w-full text-xs text-gray-600 hover:text-gray-400 py-1 transition-colors">Voltar</button>
    </div>
  )
}

function agruparPorCategoria(lista) {
  const map = new Map()
  for (const c of lista) {
    const chave = c.categoria_nome || '__sem__'
    if (!map.has(chave)) map.set(chave, { nome: c.categoria_nome || null, cor: c.categoria_cor || null, itens: [] })
    map.get(chave).itens.push(c)
  }
  return Array.from(map.values())
}

function aplicarOrdem(grupos, ordemSalva) {
  if (!ordemSalva || !ordemSalva.length) return grupos
  const posMap = new Map(ordemSalva.map((nome, i) => [nome ?? '__sem__', i]))
  return [...grupos].sort((a, b) => {
    const ai = posMap.has(a.nome ?? '__sem__') ? posMap.get(a.nome ?? '__sem__') : 9999
    const bi = posMap.has(b.nome ?? '__sem__') ? posMap.get(b.nome ?? '__sem__') : 9999
    return ai - bi
  })
}

function CategoriaCard({ grupo, onPagar, onEditar, onExcluir, idx, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, coresStatus, coresForma }) {
  const { nome, cor: corSalva, itens } = grupo
  const total = itens.reduce((s, c) => s + Number(c.valor), 0)
  const cor   = corCategoria(nome, corSalva)
  const isOver = dragOver === idx

  return (
    <div
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragOver={e => { e.preventDefault(); onDragOver(idx) }}
      onDrop={() => onDrop(idx)}
      onDragEnd={onDragEnd}
      className="rounded-2xl flex flex-col overflow-hidden transition-all duration-150"
      style={{
        background: 'var(--card)',
        border: `1px solid ${isOver ? cor : 'var(--card-border)'}`,
        boxShadow: isOver ? `0 0 0 2px ${cor}33` : 'none',
        cursor: 'grab',
      }}
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: cor }}>
            {nome || 'Sem categoria'}
          </p>
          <div className="h-0.5 w-5 rounded-full" style={{ background: cor }} />
        </div>
        <span style={{ color: 'var(--text-faint)', marginTop: 2 }}><GripIcon /></span>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {itens.map(c => (
          <div key={c.id} className="px-4 py-2.5 flex items-center gap-2"
            style={c.conta_pai_id ? { borderLeft: `2px solid ${VERM_BORDER}` } : {}}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{c.descricao}</span>
                {c.conta_pai_id && <RecBadge cartao={c.cartao_vinculado} />}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Dia {c.dia_vencimento}</span>
                <StatusBadge status={c.status} />
              </div>
              {(c.tipo_pagamento || c.forma_pagamento) && (
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {c.tipo_pagamento && <TipoBadge tipo={c.tipo_pagamento} cores={coresStatus} />}
                  {c.forma_pagamento && <FormaBadge forma={c.forma_pagamento} cores={coresForma} />}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold tabular-nums"
                style={c.status === 'paga'
                  ? { color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.35)' }
                  : { color: VERM,      textShadow: '0 0 10px rgba(255,23,68,0.3)'  }}>
                -{BRL(c.valor)}
              </p>
              <div className="flex items-center gap-2 justify-end mt-1">
                {c.status !== 'paga' && (
                  <button onClick={() => onPagar(c)} className="text-[10px] transition-colors" style={{ color: '#14b8a6' }}
                    onMouseDown={e => e.stopPropagation()}>Pagar</button>
                )}
                <button onClick={() => onEditar(c)} className="text-[10px] transition-colors" style={{ color: 'var(--text-faint)' }}
                  onMouseDown={e => e.stopPropagation()}>Editar</button>
                <button onClick={() => onExcluir(c)} className="text-[10px] hover:text-red-400 transition-colors" style={{ color: 'var(--text-faint)' }}
                  onMouseDown={e => e.stopPropagation()}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.08)' }}>
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>
          {itens.length} {itens.length === 1 ? 'conta' : 'contas'}
        </span>
        <span className="font-display font-bold text-sm tabular-nums" style={{ color: cor }}>
          {BRL(total)}
        </span>
      </div>
    </div>
  )
}

const BRL_CAT = {
  comida: 'Comida', mercado: 'Mercado', farmacia: 'Farmácia',
  compras_necessarias: 'Compras necessárias', combustivel: 'Combustível', gastos_extras: 'Gastos extras',
}
const BRL_FORMA = { credito: 'Crédito', debito: 'Débito', pix: 'PIX', dinheiro: 'Dinheiro' }

const fmtData = s => {
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

function GastosSection({ gastos, onExcluir }) {
  const total = gastos.reduce((s, g) => s + Number(g.valor), 0)
  return (
    <div className="px-4 md:px-8 pb-6 mt-2">
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--card-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Gastos do Mês</p>
          <span className="text-xs font-bold tabular-nums text-orange-400">{BRL(total)}</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {gastos.map(g => (
            <div key={g.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{g.descricao}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}>
                    {BRL_CAT[g.categoria] || g.categoria}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    {BRL_FORMA[g.forma_pagamento] || g.forma_pagamento}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{fmtData(g.data)}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-orange-400">-{BRL(g.valor)}</p>
                <button onClick={() => onExcluir(g.id)}
                  className="text-[10px] hover:text-red-400 transition-colors mt-1"
                  style={{ color: 'var(--text-faint)' }}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Contas() {
  const { mesSelecionado, config } = useApp()
  const [lista, setLista]               = useState([])
  const [grupos, setGrupos]             = useState([])
  const [modal, setModal]               = useState(null)
  const [confirmPagar, setConfirmPagar] = useState(null)
  const [excluirRec, setExcluirRec]     = useState(null)
  const [dragOver, setDragOver]         = useState(null)
  const [historico, setHistorico]       = useState([])
  const [gastos, setGastos]             = useState([])
  const dragIdx    = useRef(null)
  const ordemSalva = useRef([])

  const carregarGastos = () => getGastos(mesSelecionado).then(setGastos)

  useEffect(() => {
    Promise.all([
      getContas(mesSelecionado),
      getConfiguracoes(),
      getDashboard(mesSelecionado),
      getGastos(mesSelecionado),
    ]).then(([contas, cfg, dash, gst]) => {
      const ordem = cfg.ordem_grupos_contas ?? []
      ordemSalva.current = ordem
      setLista(contas)
      setGrupos(aplicarOrdem(agruparPorCategoria(contas), ordem))
      setHistorico(dash.historico_mensal || [])
      setGastos(gst)
    })
  }, [mesSelecionado])

  useEffect(() => {
    window.addEventListener('gasto-criado', carregarGastos)
    return () => window.removeEventListener('gasto-criado', carregarGastos)
  }, [mesSelecionado])

  function salvarOrdem(novosGrupos) {
    const ordem = novosGrupos.map(g => g.nome ?? null)
    ordemSalva.current = ordem
    patchConfiguracao('ordem_grupos_contas', JSON.stringify(ordem))
  }

  function onDragStart(i) { dragIdx.current = i }
  function onDragOver(i)  { setDragOver(i) }
  function onDrop(i) {
    if (dragIdx.current === null || dragIdx.current === i) { dragIdx.current = null; setDragOver(null); return }
    setGrupos(g => {
      const next = [...g]
      const [moved] = next.splice(dragIdx.current, 1)
      next.splice(i, 0, moved)
      salvarOrdem(next)
      return next
    })
    dragIdx.current = null
    setDragOver(null)
  }
  function onDragEnd() { dragIdx.current = null; setDragOver(null) }

  async function recarregar() {
    const contas = await getContas(mesSelecionado)
    setLista(contas)
    setGrupos(aplicarOrdem(agruparPorCategoria(contas), ordemSalva.current))
  }

  async function salvar(dados) {
    if (modal === 'novo') await criarConta(dados)
    else await atualizarConta(modal.id, dados)
    setModal(null); recarregar()
  }

  async function excluir(conta) {
    if (conta.conta_pai_id) { setExcluirRec(conta); return }
    if (!confirm('Excluir conta?')) return
    await deletarConta(conta.id)
    setLista(l => l.filter(x => x.id !== conta.id))
    setGrupos(g => g.map(gr => ({ ...gr, itens: gr.itens.filter(x => x.id !== conta.id) })).filter(gr => gr.itens.length))
  }

  async function excluirSoMes(conta) {
    setExcluirRec(null)
    await deletarConta(conta.id)
    setLista(l => l.filter(x => x.id !== conta.id))
    setGrupos(g => g.map(gr => ({ ...gr, itens: gr.itens.filter(x => x.id !== conta.id) })).filter(gr => gr.itens.length))
  }

  async function excluirSerie(conta) {
    setExcluirRec(null)
    await deletarConta(conta.conta_pai_id)
    recarregar()
  }

  async function confirmarPagar() {
    if (!confirmPagar) return
    await pagarConta(confirmPagar.id, new Date().toISOString().split('T')[0])
    setConfirmPagar(null)
    recarregar()
  }

  const total = lista.reduce((s, c) => s + Number(c.valor), 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Contas">
        <MonthPicker />
      </PageHeader>

      {lista.length > 0 && (
        <div className="px-4 md:px-8 py-3 md:py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Card total — fixo no desktop, full-width no mobile */}
            <div className="rounded-xl px-4 md:px-5 py-4 relative overflow-hidden md:w-64 shrink-0"
              style={{ background: VERM_BG, border: `1px solid ${VERM_BORDER}` }}>
              <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ background: 'radial-gradient(circle at 10% 50%, #ff1744, transparent 60%)' }} />
              <div className="flex md:flex-col justify-between md:justify-start h-full">
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: VERM }}>Total do Mês</p>
                  <div className="h-0.5 w-5 rounded-full mb-2" style={{ background: VERM }} />
                  <p className="font-display text-lg md:text-2xl font-bold tabular-nums"
                    style={{ color: VERM, textShadow: '0 0 16px rgba(255,23,68,0.4)' }}>
                    {BRL(total)}
                  </p>
                </div>
                <div className="md:mt-4 text-right md:text-left">
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: VERM }}>Registros</p>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: VERM }}>{lista.length}</p>
                </div>
              </div>
            </div>
            {/* Gráfico — ao lado no desktop, abaixo no mobile */}
            {historico.length > 0 && (
              <GraficoMensal
                titulo="Saídas Mensais"
                dados={historico}
                dataKey="saidas"
                cor={VERM}
                gradientId="gradSaidasPage"
              />
            )}
          </div>
        </div>
      )}

      {!lista.length ? (
        <div className="text-center py-16 text-gray-600 text-sm px-4">
          <p className="mb-2">Nenhuma conta registrada neste mês.</p>
          <button onClick={() => setModal('novo')} style={{ color: VERM }}
            className="hover:opacity-80 underline underline-offset-2">
            Adicionar agora
          </button>
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grupos.map((grupo, idx) => (
            <CategoriaCard
              key={grupo.nome || '__sem__'}
              grupo={grupo}
              idx={idx}
              dragOver={dragOver}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onPagar={setConfirmPagar}
              onEditar={setModal}
              onExcluir={excluir}
              coresStatus={config?.badge_status_cores}
              coresForma={config?.badge_forma_cores}
            />
          ))}
        </div>
      )}

      {gastos.length > 0 && (
        <GastosSection gastos={gastos} onExcluir={async id => {
          await deletarGasto(id)
          setGastos(g => g.filter(x => x.id !== id))
        }} />
      )}

      {confirmPagar && (
        <Modal titulo="CONFIRMAR PAGAMENTO" onClose={() => setConfirmPagar(null)}>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Confirma o pagamento da conta abaixo?</p>
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white font-medium">{confirmPagar.descricao}</p>
              <p className="text-teal-400 font-display font-bold text-xl mt-1 tabular-nums">{BRL(confirmPagar.valor)}</p>
              <p className="text-gray-600 text-xs mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmPagar(null)} className="btn-ghost">Cancelar</button>
              <button onClick={confirmarPagar} className="btn-primary">Confirmar Pagamento</button>
            </div>
          </div>
        </Modal>
      )}

      {excluirRec && (
        <Modal titulo="EXCLUIR RECORRENTE" onClose={() => setExcluirRec(null)}>
          <ModalExcluirRec
            conta={excluirRec}
            onSoMes={() => excluirSoMes(excluirRec)}
            onSerie={() => excluirSerie(excluirRec)}
            onCancelar={() => setExcluirRec(null)}
          />
        </Modal>
      )}

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA CONTA' : 'EDITAR CONTA'} onClose={() => setModal(null)}>
          <FormConta inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}

      <FABButton cor="#ff1744" onClick={() => setModal('novo')} posicao="center" />
    </div>
  )
}
