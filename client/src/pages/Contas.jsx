import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getContas, criarConta, atualizarConta, deletarConta, pagarConta } from '../api/contas'
import { getDividas, criarDivida, atualizarDivida, deletarDivida, registrarParcela } from '../api/dividas'
import { getConfiguracoes, patchConfiguracao } from '../api/configuracoes'
import { getDashboard } from '../api/dashboard'
import { getCartoes, criarCartao, atualizarCartao, deletarCartao, getGastosCartao } from '../api/cartoes'
import { CORES_STATUS_DEFAULT, CORES_FORMA_DEFAULT } from '../context/AppContext'
import Modal from '../components/Modal'
import FormConta from '../components/FormConta'
import FormDivida from '../components/FormDivida'
import FormCartao from '../components/FormCartao'
import DividaCard from '../components/DividaCard'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import GraficoMensal from '../components/GraficoMensal'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const VERM        = '#ff1744'
const VERM_BG     = 'rgba(255,23,68,0.06)'
const VERM_BORDER = 'rgba(255,23,68,0.2)'


function corCategoria(nome, cor) {
  if (cor) return cor
  return '#6b7280'
}

/* ── Badge components ─────────────────────────────── */

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

/* ── Icons ─────────────────────────────────────────── */

const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

/* ── Modais de exclusão ─────────────────────────────── */

function ModalExcluirParcelado({ conta, onSoParcela, onTodos, onCancelar }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        <span className="text-white font-medium">{conta.descricao}</span> é uma compra parcelada.
      </p>
      <div className="rounded-lg px-3 py-2 text-xs"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)' }}>
        Parcela <span className="text-white font-semibold">{conta.parcela_atual}</span> de <span className="text-white font-semibold">{conta.num_parcelas}</span>
      </div>
      <div className="space-y-2">
        <button onClick={onSoParcela} className="w-full text-left rounded-xl px-4 py-3 text-sm transition-colors"
          style={{ background: 'var(--card-alt)', border: '1px solid var(--card-border)' }}>
          <p className="text-white font-medium">Excluir só esta parcela</p>
          <p className="text-gray-600 text-xs mt-0.5">Remove apenas a parcela {conta.parcela_atual}.</p>
        </button>
        <button onClick={onTodos} className="w-full text-left rounded-xl px-4 py-3 text-sm transition-colors"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <p className="text-red-400 font-medium">Excluir todo o parcelamento</p>
          <p className="text-gray-600 text-xs mt-0.5">Remove todas as {conta.num_parcelas} parcelas. Não pode ser desfeito.</p>
        </button>
      </div>
      <button onClick={onCancelar} className="w-full text-xs text-gray-600 hover:text-gray-400 py-1 transition-colors">Voltar</button>
    </div>
  )
}

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

/* ── Helpers ─────────────────────────────────────────── */

function agruparPorCategoria(lista) {
  const map = new Map()
  for (const c of lista) {
    const chave = c.categoria_nome || '__sem__'
    if (!map.has(chave)) map.set(chave, { nome: c.categoria_nome || null, cor: c.categoria_cor || null, itens: [] })
    map.get(chave).itens.push(c)
  }
  return Array.from(map.values())
}

function aplicarOrdemContas(grupos, ordemSalva) {
  if (!ordemSalva || !ordemSalva.length) return grupos
  const posMap = new Map(ordemSalva.map((nome, i) => [nome ?? '__sem__', i]))
  return [...grupos].sort((a, b) => {
    const ai = posMap.has(a.nome ?? '__sem__') ? posMap.get(a.nome ?? '__sem__') : 9999
    const bi = posMap.has(b.nome ?? '__sem__') ? posMap.get(b.nome ?? '__sem__') : 9999
    return ai - bi
  })
}

function aplicarOrdemDividas(lista, ordemIds) {
  if (!ordemIds || !ordemIds.length) return lista
  const posMap = new Map(ordemIds.map((id, i) => [id, i]))
  return [...lista].sort((a, b) => {
    const ai = posMap.has(a.id) ? posMap.get(a.id) : 9999
    const bi = posMap.has(b.id) ? posMap.get(b.id) : 9999
    return ai - bi
  })
}

const OCULTOS_KEY = 'contas_grupos_ocultos'

/* ── Tab: Contas — CategoriaCard ─────────────────────── */

function CategoriaCard({ grupo, onPagar, onEditar, onExcluir, onOcultar, idx, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, coresStatus, coresForma, badgesVisiveis }) {
  const { nome, cor: corSalva, itens } = grupo
  const total = itens.reduce((s, c) => s + Number(c.valor), 0)
  const cor   = corCategoria(nome, corSalva)
  const isOver = dragOver === idx
  const dragFromGrip = useRef(false)

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
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: 'var(--card)',
        border: `1px solid ${isOver ? cor : 'var(--card-border)'}`,
        boxShadow: isOver ? `0 0 0 2px ${cor}33` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: cor }}>
            {nome || 'Sem categoria'}
          </p>
          <div className="h-0.5 w-5 rounded-full" style={{ background: cor }} />
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
          <button
            onClick={() => onOcultar(nome)}
            title="Ocultar card"
            className="text-gray-700 hover:text-gray-400 transition-colors"
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
          >
            <EyeOffIcon />
          </button>
          <span
            style={{ color: 'var(--text-faint)', cursor: 'grab' }}
            onMouseDown={() => { dragFromGrip.current = true }}
            onMouseLeave={() => { dragFromGrip.current = false }}
          >
            <GripIcon />
          </span>
        </div>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: 'var(--divider)' }}>
        {itens.map(c => (
          <div key={c.id} className="px-4 py-3 flex items-center gap-3"
            style={c.conta_pai_id ? { borderLeft: `2px solid ${VERM_BORDER}` } : {}}>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold leading-snug truncate block" style={{ color: 'var(--text)' }}>
                {c.descricao}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Dia {c.dia_vencimento}</span>
                {c.parcela_atual != null && (
                  <span className="text-[10px] tabular-nums font-semibold px-1 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' }}>
                    {c.parcela_atual}/{c.num_parcelas}
                  </span>
                )}
                <StatusBadge status={c.status} />
              </div>
              {(() => {
                const bv = badgesVisiveis || {}
                const showRec   = c.conta_pai_id != null
                const showTipo  = c.tipo_pagamento  && bv[c.tipo_pagamento]  !== false
                const showForma = c.forma_pagamento && bv[c.forma_pagamento] !== false
                if (!showRec && !showTipo && !showForma) return null
                return (
                  <div className="flex items-center gap-1 mt-1.5">
                    {showRec   && <RecBadge cartao={c.cartao_vinculado} />}
                    {showTipo  && <TipoBadge tipo={c.tipo_pagamento}  cores={coresStatus} />}
                    {showForma && <FormaBadge forma={c.forma_pagamento} cores={coresForma} />}
                  </div>
                )
              })()}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold tabular-nums"
                style={c.status === 'paga'
                  ? { color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.35)' }
                  : { color: VERM,      textShadow: '0 0 10px rgba(255,23,68,0.3)'  }}>
                -{BRL(c.valor)}
              </p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <button onClick={() => onEditar(c)}
                  className="text-[13px] transition-colors hover:text-white" style={{ color: 'var(--text-faint)' }}
                  onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} title="Editar">✏️</button>
                <button onClick={() => onExcluir(c)}
                  className="text-[13px] hover:text-red-400 transition-colors" style={{ color: 'var(--text-faint)' }}
                  onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} title="Excluir">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--card-border)', background: 'var(--card-dim)' }}>
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

/* ── Tab: Cartões — CartaoCard ───────────────────────── */

const CAT_CORES_GASTO = {
  comida: '#f97316', mercado: '#22c55e', farmacia: '#60a5fa',
  compras_necessarias: '#a78bfa', combustivel: '#facc15', gastos_extras: '#f87171',
}
const CAT_LABEL_GASTO = {
  comida: 'Comida', mercado: 'Mercado', farmacia: 'Farmácia',
  compras_necessarias: 'Compras necessárias', combustivel: 'Combustível', gastos_extras: 'Gastos extras',
}
const fmtDataGasto = s => {
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

function CartaoCard({ cartao, contas, mes, onEditar, onExcluir, onEditarDivida, onExcluirDivida }) {
  const [gastos, setGastos] = useState([])
  const [dividasCartao, setDividasCartao] = useState([])
  const [expandido, setExpandido] = useState(true)
  const cor = cartao.cor || '#6366f1'

  const carregarDividasCartao = () =>
    getDividas(true, cartao.id).then(setDividasCartao).catch(() => {})

  useEffect(() => {
    getGastosCartao(cartao.id, mes).then(setGastos).catch(() => {})
    carregarDividasCartao()
  }, [cartao.id, mes])

  const assinaturas = contas.filter(
    c => c.cartao_vinculado?.trim().toLowerCase() === cartao.nome?.trim().toLowerCase()
  )

  const totalAssinaturas = assinaturas.reduce((s, c) => s + Number(c.valor), 0)
  const totalGastos = gastos.reduce((s, g) => s + Number(g.valor), 0)
  const totalDividas = dividasCartao.reduce((s, d) => s + Number(d.valor_parcela), 0)
  const total = totalAssinaturas + totalGastos + totalDividas

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: `1px solid ${cor}33` }}>

      {/* Cabeçalho do cartão */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between"
        style={{ borderBottom: `1px solid ${cor}22` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${cor}22`, border: `1px solid ${cor}44` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{cartao.nome}</p>
            {cartao.conta_pagamento && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                Pago por: <span style={{ color: cor }}>{cartao.conta_pagamento}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: cor }}>Total mês</p>
            <p className="font-bold tabular-nums text-sm" style={{ color: cor }}>{BRL(total)}</p>
          </div>
          <button onClick={() => setExpandido(e => !e)}
            className="text-gray-600 hover:text-gray-300 transition-colors text-xs">
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="pb-3">
          {/* Assinaturas */}
          {assinaturas.length > 0 && (
            <div>
              <div className="px-4 py-2 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--divider)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cor }}>
                  Assinaturas
                </p>
                <span className="text-[10px] tabular-nums font-semibold" style={{ color: cor }}>
                  {BRL(totalAssinaturas)}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                {assinaturas.map(c => (
                  <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.descricao}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Recorrente · Dia {c.dia_vencimento}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      -{BRL(c.valor)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parcelamentos vinculados */}
          {dividasCartao.length > 0 && (
            <div>
              <div className="px-4 py-2 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--divider)', borderTop: assinaturas.length > 0 ? '1px solid var(--divider)' : 'none' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cor }}>
                  Parcelamentos
                </p>
                <span className="text-[10px] tabular-nums font-semibold" style={{ color: cor }}>
                  {BRL(totalDividas)}/mês
                </span>
              </div>
              <div className="px-3 py-2 space-y-2">
                {dividasCartao.map(d => (
                  <DividaCard
                    key={d.id}
                    divida={d}
                    onEdit={() => onEditarDivida(d)}
                    onDelete={() => onExcluirDivida(d.id, carregarDividasCartao)}
                    onRefresh={carregarDividasCartao}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Gastos do mês */}
          {gastos.length > 0 && (
            <div>
              <div className="px-4 py-2 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--divider)', borderTop: assinaturas.length > 0 ? '1px solid var(--divider)' : 'none' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cor }}>
                  Gastos do Mês
                </p>
                <span className="text-[10px] tabular-nums font-semibold" style={{ color: cor }}>
                  {BRL(totalGastos)}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                {gastos.map(g => (
                  <div key={g.id} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{g.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${CAT_CORES_GASTO[g.categoria] || '#6b7280'}22`,
                            color: CAT_CORES_GASTO[g.categoria] || '#6b7280',
                          }}>
                          {CAT_LABEL_GASTO[g.categoria] || g.categoria}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                          {fmtDataGasto(g.data)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: cor }}>
                      -{BRL(g.valor)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assinaturas.length === 0 && gastos.length === 0 && dividasCartao.length === 0 && (
            <p className="px-4 py-4 text-xs text-center" style={{ color: 'var(--text-faint)' }}>
              Nenhum gasto, assinatura ou parcelamento neste mês.
            </p>
          )}
        </div>
      )}

      {/* Rodapé com ações */}
      <div className="px-4 py-2.5 flex items-center gap-3 justify-end"
        style={{ borderTop: '1px solid var(--divider)', background: 'var(--card-dim)' }}>
        <button onClick={() => onEditar(cartao)}
          className="text-[11px] transition-colors" style={{ color: 'var(--text-faint)' }}>
          Editar
        </button>
        <button onClick={() => onExcluir(cartao.id)}
          className="text-[11px] hover:text-red-400 transition-colors" style={{ color: 'var(--text-faint)' }}>
          Excluir
        </button>
      </div>
    </div>
  )
}

/* ── ParcelaMesItem — dívida como item pagável na aba Contas ── */

function ParcelaMesItem({ divida: d, onPagar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [pagando, setPagando] = useState(false)

  const hoje = new Date()
  const mesHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const mesProxVenc = d.proxima_vencimento ? d.proxima_vencimento.slice(0, 7) : null
  const jaPagouEsseMes = d.parcelas_pagas > 0 && (mesProxVenc === null || mesProxVenc > mesHoje)
  const temPendente = (d.parcelas_pagas || 0) < d.num_parcelas
  const progresso = d.num_parcelas > 0 ? ((d.parcelas_pagas || 0) / d.num_parcelas) * 100 : 0

  const fmtDate = s => {
    if (!s) return '—'
    const dt = new Date(s)
    dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset())
    return dt.toLocaleDateString('pt-BR')
  }

  async function pagar(e) {
    e.stopPropagation()
    setPagando(true)
    try {
      await registrarParcela(d.id)
      setConfirmando(false)
      onPagar()
    } finally {
      setPagando(false)
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold leading-snug truncate block" style={{ color: 'var(--text)' }}>
            {d.descricao}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-600">
              {d.parcelas_pagas || 0}/{d.num_parcelas} parcelas
            </span>
            {d.proxima_vencimento && (
              <span className="text-[10px] text-gray-600">· vence {fmtDate(d.proxima_vencimento)}</span>
            )}
          </div>
          <div className="mt-1.5 h-1 rounded-full w-32" style={{ background: 'var(--progress-track)' }}>
            <div className="h-1 rounded-full bg-red-600 transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold tabular-nums text-sm"
            style={jaPagouEsseMes ? { color: '#22c55e' } : { color: 'var(--text)' }}>
            {BRL(d.valor_parcela)}
          </p>
          <div className="mt-1.5">
            {jaPagouEsseMes ? (
              <span className="text-[10px] text-green-500 font-semibold">Pago</span>
            ) : !temPendente ? (
              <span className="text-[10px] text-gray-600">Quitado</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── FAB speed dial ──────────────────────────────────── */

function FABSpeedDial({ onNovaConta, onNovaDivida, onNovoCartao, activeTab }) {
  const [open, setOpen] = useState(false)
  const [scrollando, setScrollando] = useState(false)

  useEffect(() => {
    let timer
    const onScroll = () => {
      setScrollando(true)
      clearTimeout(timer)
      timer = setTimeout(() => setScrollando(false), 800)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  }, [])

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Container posicionado — mobile: acima do bottom nav; desktop: canto inferior */}
      <div
        className="fixed z-40 flex flex-col items-center gap-2.5 bottom-[5.5rem] left-1/2 -translate-x-1/2 md:bottom-6 md:left-1/2 md:-translate-x-1/2"
      >
        {/* Speed dial options */}
        <div
          className="flex flex-col items-center gap-2 transition-all duration-200"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {activeTab === 'cartoes' ? (
            <button
              onClick={() => { onNovoCartao(); setOpen(false) }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: '#6366f1', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Novo Cartão
            </button>
          ) : (
            <>
              <button
                onClick={() => { onNovaDivida(); setOpen(false) }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap active:scale-95 transition-transform"
                style={{ background: '#7c3aed', color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Nova Dívida
              </button>
              <button
                onClick={() => { onNovaConta(); setOpen(false) }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap active:scale-95 transition-transform"
                style={{ background: VERM, color: '#fff', boxShadow: `0 4px 20px ${VERM}70` }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nova Conta
              </button>
            </>
          )}
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center active:scale-95 transition-all duration-300"
          style={{
            background: open ? 'rgba(255,255,255,0.15)' : VERM,
            boxShadow: open ? '0 4px 20px rgba(255,255,255,0.15)' : `0 4px 20px ${VERM}70`,
            opacity: scrollando ? 0.25 : 1,
            border: open ? '1px solid rgba(255,255,255,0.2)' : 'none',
          }}
          aria-label="Novo registro"
        >
          <span
            className="text-white text-2xl leading-none select-none font-light transition-transform duration-300"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            +
          </span>
        </button>
      </div>

    </>
  )
}

/* ── Página principal ────────────────────────────────── */

export default function Contas() {
  const { mesSelecionado, config } = useApp()

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('contas')

  // ── Contas state ──
  const [lista, setLista]               = useState([])
  const [grupos, setGrupos]             = useState([])
  const [gruposOcultos, setGruposOcultos] = useState(new Set())
  const [modalConta, setModalConta]     = useState(null)
  const [confirmPagar, setConfirmPagar] = useState(null)
  const [excluirRec, setExcluirRec]     = useState(null)
  const [excluirParcelado, setExcluirParcelado] = useState(null)
  const [dragOverContas, setDragOverContas] = useState(null)
  const [historico, setHistorico]       = useState([])
  const dragIdxContas = useRef(null)
  const ordemSalvaContas = useRef([])

  // ── Dívidas state ──
  const [dividas, setDividas]           = useState([])
  const [filtroDividas, setFiltroDividas] = useState('true')
  const [modalDivida, setModalDivida]   = useState(null)
  const [dragOverDividas, setDragOverDividas] = useState(null)
  const dragIdxDividas = useRef(null)
  const ordemSalvaDividas = useRef([])

  // ── Cartões state ──
  const [cartoes, setCartoes]           = useState([])
  const [modalCartao, setModalCartao]   = useState(null)

  /* ── Contas effects/functions ── */

  useEffect(() => {
    Promise.all([
      getContas(mesSelecionado),
      getConfiguracoes(),
      getDashboard(mesSelecionado),
    ]).then(([contas, cfg, dash]) => {
      const ordem = cfg.ordem_grupos_contas ?? []
      ordemSalvaContas.current = ordem
      setLista(contas)
      setGrupos(aplicarOrdemContas(agruparPorCategoria(contas), ordem))
      setGruposOcultos(new Set(Array.isArray(cfg[OCULTOS_KEY]) ? cfg[OCULTOS_KEY] : []))
      setHistorico(dash.historico_mensal || [])
    }).catch(() => {
      getContas(mesSelecionado).then(contas => {
        setLista(contas)
        setGrupos(aplicarOrdemContas(agruparPorCategoria(contas), ordemSalvaContas.current))
      }).catch(() => {})
    })
  }, [mesSelecionado])

  function ocultarGrupo(nome) {
    const chave = nome ?? '__sem__'
    setGruposOcultos(prev => {
      const next = new Set(prev)
      next.add(chave)
      patchConfiguracao(OCULTOS_KEY, JSON.stringify([...next]))
      return next
    })
  }

  function mostrarTodos() {
    setGruposOcultos(new Set())
    patchConfiguracao(OCULTOS_KEY, JSON.stringify([]))
  }

  function salvarOrdemContas(novosGrupos) {
    const ordem = novosGrupos.map(g => g.nome ?? null)
    ordemSalvaContas.current = ordem
    patchConfiguracao('ordem_grupos_contas', JSON.stringify(ordem))
  }

  function onDragStartContas(i) { dragIdxContas.current = i }
  function onDragOverContas(i)  { setDragOverContas(i) }
  function onDropContas(i) {
    if (dragIdxContas.current === null || dragIdxContas.current === i) { dragIdxContas.current = null; setDragOverContas(null); return }
    setGrupos(g => {
      const next = [...g]
      const [moved] = next.splice(dragIdxContas.current, 1)
      next.splice(i, 0, moved)
      salvarOrdemContas(next)
      return next
    })
    dragIdxContas.current = null
    setDragOverContas(null)
  }
  function onDragEndContas() { dragIdxContas.current = null; setDragOverContas(null) }

  async function recarregarContas() {
    const contas = await getContas(mesSelecionado)
    setLista(contas)
    setGrupos(aplicarOrdemContas(agruparPorCategoria(contas), ordemSalvaContas.current))
  }

  async function salvarConta(dados) {
    if (modalConta === 'novo') await criarConta(dados)
    else await atualizarConta(modalConta.id, dados)
    setModalConta(null)
    recarregarContas()
  }

  async function excluirConta(conta) {
    if (conta.tipo_pagamento === 'parcelado' && conta.parcela_atual != null) {
      setExcluirParcelado(conta); return
    }
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
    recarregarContas()
  }

  async function excluirSoParcela(conta) {
    setExcluirParcelado(null)
    await deletarConta(conta.id)
    recarregarContas()
  }

  async function excluirTodoParcelamento(conta) {
    setExcluirParcelado(null)
    await deletarConta(conta.conta_pai_id)
    recarregarContas()
  }

  async function confirmarPagar() {
    if (!confirmPagar) return
    await pagarConta(confirmPagar.id, new Date().toISOString().split('T')[0])
    setConfirmPagar(null)
    recarregarContas()
  }

  /* ── Dívidas effects/functions ── */

  const chaveConfigDividas = `ordem_dividas_${filtroDividas}`

  const carregarDividas = async () => {
    let data
    if (filtroDividas === '') {
      const [a, i] = await Promise.all([getDividas(true), getDividas(false)])
      data = [...a, ...i]
    } else {
      data = await getDividas(filtroDividas === 'true')
    }
    const cfg = await getConfiguracoes()
    const ordem = cfg[chaveConfigDividas] ?? []
    ordemSalvaDividas.current = ordem
    setDividas(aplicarOrdemDividas(data, ordem))
  }

  useEffect(() => {
    if (activeTab === 'dividas' || activeTab === 'contas') carregarDividas()
  }, [filtroDividas, activeTab])

  function salvarOrdemDividas(novaLista) {
    const ordem = novaLista.map(d => d.id)
    ordemSalvaDividas.current = ordem
    patchConfiguracao(chaveConfigDividas, JSON.stringify(ordem))
  }

  function onDragStartDividas(i) { dragIdxDividas.current = i }
  function onDragOverDividas(i)  { setDragOverDividas(i) }
  function onDropDividas(i) {
    if (dragIdxDividas.current === null || dragIdxDividas.current === i) { dragIdxDividas.current = null; setDragOverDividas(null); return }
    setDividas(l => {
      const next = [...l]
      const [moved] = next.splice(dragIdxDividas.current, 1)
      next.splice(i, 0, moved)
      salvarOrdemDividas(next)
      return next
    })
    dragIdxDividas.current = null
    setDragOverDividas(null)
  }
  function onDragEndDividas() { dragIdxDividas.current = null; setDragOverDividas(null) }

  async function salvarDivida(dados) {
    if (modalDivida === 'novo') await criarDivida(dados)
    else await atualizarDivida(modalDivida.id, dados)
    setModalDivida(null)
    carregarDividas()
  }

  async function excluirDivida(id) {
    if (!confirm('Excluir dívida e todas as parcelas?')) return
    await deletarDivida(id)
    setDividas(l => l.filter(x => x.id !== id))
  }

  /* ── Cartões effects/functions ── */

  const carregarCartoes = () => getCartoes().then(setCartoes).catch(() => {})

  useEffect(() => {
    if (activeTab === 'cartoes') carregarCartoes()
  }, [activeTab])

  async function salvarCartao(dados) {
    if (modalCartao === 'novo') await criarCartao(dados)
    else await atualizarCartao(modalCartao.id, dados)
    setModalCartao(null)
    carregarCartoes()
  }

  async function excluirCartao(id) {
    if (!confirm('Excluir cartão? Os gastos vinculados perdem o vínculo.')) return
    await deletarCartao(id)
    setCartoes(l => l.filter(c => c.id !== id))
  }

  /* ── Computed ── */

  // Filtra itens vinculados a cartão — eles aparecem apenas na aba Cartões
  const listaSemCartao = lista.filter(c => !c.cartao_vinculado)
  const gruposSemCartao = grupos
    .map(g => ({ ...g, itens: g.itens.filter(c => !c.cartao_vinculado) }))
    .filter(g => g.itens.length > 0)
  const dividasSemCartao = dividas.filter(d => !d.cartao_id)

  const totalContas = listaSemCartao.reduce((s, c) => s + Number(c.valor), 0)
  const totalMensalDividas = dividasSemCartao.filter(d => d.ativa).reduce((s, d) => s + Number(d.valor_parcela), 0)

  /* ── Tabs ── */

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'dividas' && dividas.length === 0) carregarDividas()
    if (tab === 'cartoes' && cartoes.length === 0) carregarCartoes()
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      {/* Header — MonthPicker só aparece na aba Contas */}
      <PageHeader titulo="Contas">
        {(activeTab === 'contas' || activeTab === 'cartoes') && <MonthPicker />}
        {activeTab === 'dividas' && (
          <select value={filtroDividas} onChange={e => setFiltroDividas(e.target.value)}
            className="select-dark !w-auto text-xs md:text-sm">
            <option value="true">Ativas</option>
            <option value="false">Quitadas</option>
            <option value="">Todas</option>
          </select>
        )}
      </PageHeader>

      {/* Tab bar */}
      <div className="px-4 md:px-8 pt-2 pb-0">
        <div className="flex gap-1 p-1 rounded-xl w-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }}>
          {[
            { id: 'contas',  label: 'Contas'   },
            { id: 'dividas', label: 'Dívidas'  },
            { id: 'cartoes', label: 'Cartões'  },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={activeTab === id
                ? { background: VERM, color: '#fff', boxShadow: `0 2px 12px ${VERM}60` }
                : { color: 'var(--text-faint)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Contas ─────────────────────────────── */}
      {activeTab === 'contas' && (
        <>
          {listaSemCartao.length > 0 && (
            <div className="px-4 md:px-8 py-3 md:py-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
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
                        {BRL(totalContas)}
                      </p>
                    </div>
                    <div className="md:mt-4 text-right md:text-left">
                      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: VERM }}>Registros</p>
                      <p className="text-xl md:text-2xl font-bold" style={{ color: VERM }}>{listaSemCartao.length}</p>
                    </div>
                  </div>
                </div>
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

          {gruposOcultos.size > 0 && (
            <div className="mx-4 md:mx-8 mb-2 flex items-center justify-between gap-3 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                {gruposOcultos.size} {gruposOcultos.size === 1 ? 'grupo oculto' : 'grupos ocultos'}
              </span>
              <button onClick={mostrarTodos}
                className="text-[11px] font-medium transition-colors"
                style={{ color: '#14b8a6' }}>
                Mostrar todos
              </button>
            </div>
          )}

          {!listaSemCartao.length ? (
            <div className="text-center py-16 text-gray-600 text-sm px-4">
              <p className="mb-2">Nenhuma conta registrada neste mês.</p>
              <button onClick={() => setModalConta('novo')} style={{ color: VERM }}
                className="hover:opacity-80 underline underline-offset-2">
                Adicionar agora
              </button>
            </div>
          ) : (
            <div className="px-4 md:px-8 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {gruposSemCartao
                .filter(g => !gruposOcultos.has(g.nome ?? '__sem__'))
                .map((grupo, idx) => (
                  <CategoriaCard
                    key={grupo.nome || '__sem__'}
                    grupo={grupo}
                    idx={idx}
                    dragOver={dragOverContas}
                    onDragStart={onDragStartContas}
                    onDragOver={onDragOverContas}
                    onDrop={onDropContas}
                    onDragEnd={onDragEndContas}
                    onPagar={setConfirmPagar}
                    onEditar={setModalConta}
                    onExcluir={excluirConta}
                    onOcultar={ocultarGrupo}
                    coresStatus={config?.badge_status_cores}
                    coresForma={config?.badge_forma_cores}
                    badgesVisiveis={config?.badges_visiveis}
                  />
                ))
              }
            </div>
          )}

          {/* ── Parcelas do mês ── */}
          {dividasSemCartao.filter(d => d.ativa).length > 0 && (
            <div className="px-4 md:px-8 pb-6 space-y-3">
              {Object.entries(
                dividasSemCartao.filter(d => d.ativa).reduce((acc, d) => {
                  const cat = d.categoria_nome || 'Sem categoria'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(d)
                  return acc
                }, {})
              ).map(([cat, itens]) => (
                <div key={cat} className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: VERM }}>{cat}</p>
                    <p className="text-[10px] text-gray-500 tabular-nums">
                      {BRL(itens.reduce((s, d) => s + Number(d.valor_parcela), 0))}/mês
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                    {itens.map(d => (
                      <ParcelaMesItem key={d.id} divida={d} onPagar={() => carregarDividas()} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Dívidas ─────────────────────────────── */}
      {activeTab === 'dividas' && (
        <>
          {filtroDividas === 'true' && totalMensalDividas > 0 && (
            <div className="mx-4 md:mx-8 mt-4 rounded-xl px-5 py-4 flex justify-between items-center"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Comprometimento mensal</span>
              <span className="font-display font-bold text-red-400 tabular-nums">{BRL(totalMensalDividas)}</span>
            </div>
          )}

          <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {!dividasSemCartao.length
              ? <div className="text-center py-16 text-gray-600 text-sm">Nenhuma dívida encontrada.</div>
              : dividasSemCartao.map((d, idx) => (
                  <DividaCard
                    key={d.id}
                    divida={d}
                    idx={idx}
                    dragOver={dragOverDividas}
                    onDragStart={onDragStartDividas}
                    onDragOver={onDragOverDividas}
                    onDrop={onDropDividas}
                    onDragEnd={onDragEndDividas}
                    onEdit={() => setModalDivida(d)}
                    onDelete={() => excluirDivida(d.id)}
                    onRefresh={carregarDividas}
                  />
                ))
            }
          </div>
        </>
      )}

      {/* ── Tab: Cartões ─────────────────────────────── */}
      {activeTab === 'cartoes' && (
        <>
          {!cartoes.length ? (
            <div className="text-center py-16 text-gray-600 text-sm px-4">
              <p className="mb-2">Nenhum cartão cadastrado.</p>
              <button onClick={() => setModalCartao('novo')}
                className="hover:opacity-80 underline underline-offset-2"
                style={{ color: '#6366f1' }}>
                Adicionar cartão
              </button>
            </div>
          ) : (
            <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cartoes.map(cartao => (
                <CartaoCard
                  key={cartao.id}
                  cartao={cartao}
                  contas={lista}
                  mes={mesSelecionado}
                  onEditar={setModalCartao}
                  onExcluir={excluirCartao}
                  onEditarDivida={setModalDivida}
                  onExcluirDivida={async (id, refresh) => {
                    if (!confirm('Excluir dívida e todas as parcelas?')) return
                    await deletarDivida(id)
                    refresh()
                    carregarDividas()
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── FAB Speed Dial ─────────────────────────────── */}
      <FABSpeedDial
        activeTab={activeTab}
        onNovaConta={() => setModalConta('novo')}
        onNovaDivida={() => { setActiveTab('dividas'); setModalDivida('novo') }}
        onNovoCartao={() => setModalCartao('novo')}
      />

      {/* ── Modais: Contas ─────────────────────────────── */}
      {confirmPagar && (
        <Modal titulo="CONFIRMAR PAGAMENTO" onClose={() => setConfirmPagar(null)}>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Confirma o pagamento da conta abaixo?</p>
            <div className="rounded-lg p-4" style={{ background: 'var(--card-alt)', border: '1px solid var(--card-border)' }}>
              <p className="text-white font-medium">{confirmPagar.descricao}</p>
              <p className="text-teal-400 font-display font-bold text-xl mt-1 tabular-nums">{BRL(confirmPagar.valor)}</p>
              <p className="text-gray-600 text-xs mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            {confirmPagar.cartao_vinculado && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <p className="text-xs" style={{ color: '#86efac' }}>
                  Todas as contas vinculadas ao <span className="font-semibold text-green-300">{confirmPagar.cartao_vinculado}</span> neste mês também serão marcadas como pagas.
                </p>
              </div>
            )}
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

      {excluirParcelado && (
        <Modal titulo="EXCLUIR PARCELAMENTO" onClose={() => setExcluirParcelado(null)}>
          <ModalExcluirParcelado
            conta={excluirParcelado}
            onSoParcela={() => excluirSoParcela(excluirParcelado)}
            onTodos={() => excluirTodoParcelamento(excluirParcelado)}
            onCancelar={() => setExcluirParcelado(null)}
          />
        </Modal>
      )}

      {modalConta && (
        <Modal titulo={modalConta === 'novo' ? 'NOVA CONTA' : 'EDITAR CONTA'} onClose={() => setModalConta(null)}>
          <FormConta inicial={modalConta !== 'novo' ? modalConta : undefined} onSalvar={salvarConta} onCancelar={() => setModalConta(null)} />
        </Modal>
      )}

      {/* ── Modais: Dívidas ─────────────────────────────── */}
      {modalDivida && (
        <Modal titulo={modalDivida === 'novo' ? 'NOVA DÍVIDA' : 'EDITAR DÍVIDA'} onClose={() => setModalDivida(null)}>
          <FormDivida inicial={modalDivida !== 'novo' ? modalDivida : undefined} onSalvar={salvarDivida} onCancelar={() => setModalDivida(null)} />
        </Modal>
      )}

      {/* ── Modais: Cartões ─────────────────────────────── */}
      {modalCartao && (
        <Modal titulo={modalCartao === 'novo' ? 'NOVO CARTÃO' : 'EDITAR CARTÃO'} onClose={() => setModalCartao(null)}>
          <FormCartao inicial={modalCartao !== 'novo' ? modalCartao : undefined} onSalvar={salvarCartao} onCancelar={() => setModalCartao(null)} />
        </Modal>
      )}
    </div>
  )
}
