import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getLancamentos, criarLancamento, atualizarLancamento, deletarLancamento } from '../api/lancamentos'
import { getConfiguracoes, patchConfiguracao } from '../api/configuracoes'
import { getDashboard } from '../api/dashboard'
import Modal from '../components/Modal'
import FormEntrada from '../components/FormEntrada'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'
import GraficoMensal from '../components/GraficoMensal'
import FABButton from '../components/FABButton'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = s => {
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

const VERDE        = '#00e676'
const VERDE_BG     = 'rgba(0,230,118,0.06)'
const VERDE_BORDER = 'rgba(0,230,118,0.2)'

function corCategoria(nome, cor) {
  if (cor) return cor
  return '#6b7280'
}

function agruparPorCategoria(lista) {
  const map = new Map()
  for (const l of lista) {
    const chave = l.categoria_nome || '__sem__'
    if (!map.has(chave)) map.set(chave, { nome: l.categoria_nome || null, cor: l.categoria_cor || null, itens: [] })
    map.get(chave).itens.push(l)
  }
  return Array.from(map.values())
}

// Aplica ordem salva; categorias novas vão para o final
function aplicarOrdem(grupos, ordemSalva) {
  if (!ordemSalva || !ordemSalva.length) return grupos
  const posMap = new Map(ordemSalva.map((nome, i) => [nome ?? '__sem__', i]))
  return [...grupos].sort((a, b) => {
    const ai = posMap.has(a.nome ?? '__sem__') ? posMap.get(a.nome ?? '__sem__') : 9999
    const bi = posMap.has(b.nome ?? '__sem__') ? posMap.get(b.nome ?? '__sem__') : 9999
    return ai - bi
  })
}

const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
)

function CategoriaCard({ grupo, onEditar, onExcluir, idx, dragOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const { nome, cor: corSalva, itens } = grupo
  const total = itens.reduce((s, l) => s + Number(l.valor), 0)
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
        {itens.map(l => (
          <div key={l.id} className="px-4 py-2.5 flex items-center gap-2"
            style={{ borderLeft: `2px solid ${VERDE_BORDER}` }}>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium truncate block" style={{ color: 'var(--text)' }}>{l.descricao}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{fmtDate(l.data)}</span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold tabular-nums"
                style={{ color: VERDE, textShadow: '0 0 10px rgba(0,230,118,0.3)' }}>
                +{BRL(l.valor)}
              </p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <button onClick={() => onEditar(l)} className="text-[10px] transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                  onMouseDown={e => e.stopPropagation()}>Editar</button>
                <button onClick={() => onExcluir(l.id)} className="text-[10px] hover:text-red-400 transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                  onMouseDown={e => e.stopPropagation()}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.08)' }}>
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>
          {itens.length} {itens.length === 1 ? 'entrada' : 'entradas'}
        </span>
        <span className="font-display font-bold text-sm tabular-nums" style={{ color: cor }}>
          {BRL(total)}
        </span>
      </div>
    </div>
  )
}

export default function Entradas() {
  const { mesSelecionado } = useApp()
  const [lista, setLista]   = useState([])
  const [grupos, setGrupos] = useState([])
  const [modal, setModal]   = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [historico, setHistorico] = useState([])
  const dragIdx    = useRef(null)
  const ordemSalva = useRef([])

  // Carrega configurações e dados juntos
  useEffect(() => {
    Promise.all([
      getLancamentos({ mes: mesSelecionado, tipo: 'entrada' }),
      getConfiguracoes(),
      getDashboard(mesSelecionado),
    ]).then(([lancamentos, cfg, dash]) => {
      const ordem = cfg.ordem_grupos_entradas ?? []
      ordemSalva.current = ordem
      setLista(lancamentos)
      setGrupos(aplicarOrdem(agruparPorCategoria(lancamentos), ordem))
      setHistorico(dash.historico_mensal || [])
    })
  }, [mesSelecionado])

  function salvarOrdem(novosGrupos) {
    const ordem = novosGrupos.map(g => g.nome ?? null)
    ordemSalva.current = ordem
    patchConfiguracao('ordem_grupos_entradas', JSON.stringify(ordem))
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

  async function salvar(dados) {
    if (modal === 'novo') await criarLancamento(dados)
    else await atualizarLancamento(modal.id, dados)
    setModal(null)
    const lancamentos = await getLancamentos({ mes: mesSelecionado, tipo: 'entrada' })
    setLista(lancamentos)
    setGrupos(aplicarOrdem(agruparPorCategoria(lancamentos), ordemSalva.current))
  }

  async function excluir(id) {
    if (!confirm('Excluir entrada?')) return
    await deletarLancamento(id)
    setLista(l => l.filter(x => x.id !== id))
    setGrupos(g => g.map(gr => ({ ...gr, itens: gr.itens.filter(x => x.id !== id) })).filter(gr => gr.itens.length))
  }

  function exportarCSV() {
    const rows = [
      ['Data', 'Nome', 'Categoria', 'Valor'],
      ...lista.map(l => [fmtDate(l.data), l.descricao, l.categoria_nome || '', Number(l.valor).toFixed(2).replace('.', ',')]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `entradas-${mesSelecionado}.csv`
    a.click()
  }

  const total = lista.reduce((s, l) => s + Number(l.valor), 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Entradas">
        <MonthPicker />
        <button onClick={exportarCSV} className="btn-outline hidden sm:flex">Exportar CSV</button>
      </PageHeader>

      {lista.length > 0 && (
        <div className="px-4 md:px-8 py-3 md:py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Card total — fixo no desktop, full-width no mobile */}
            <div className="rounded-xl px-4 md:px-5 py-4 relative overflow-hidden md:w-64 shrink-0"
              style={{ background: VERDE_BG, border: `1px solid ${VERDE_BORDER}` }}>
              <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ background: 'radial-gradient(circle at 10% 50%, #00e676, transparent 60%)' }} />
              <div className="flex md:flex-col justify-between md:justify-start h-full">
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: VERDE }}>Total do Mês</p>
                  <div className="h-0.5 w-5 rounded-full mb-2" style={{ background: VERDE }} />
                  <p className="font-display text-lg md:text-2xl font-bold tabular-nums"
                    style={{ color: VERDE, textShadow: '0 0 16px rgba(0,230,118,0.4)' }}>
                    {BRL(total)}
                  </p>
                </div>
                <div className="md:mt-4 text-right md:text-left">
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: VERDE }}>Registros</p>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: VERDE }}>{lista.length}</p>
                </div>
              </div>
            </div>
            {/* Gráfico — ao lado no desktop, abaixo no mobile */}
            {historico.length > 0 && (
              <GraficoMensal
                titulo="Entradas Mensais"
                dados={historico}
                dataKey="entradas"
                cor={VERDE}
                gradientId="gradEntradasPage"
              />
            )}
          </div>
        </div>
      )}

      {!lista.length ? (
        <div className="text-center py-16 text-gray-600 text-sm px-4">
          <p className="mb-2">Nenhuma entrada registrada neste mês.</p>
          <button onClick={() => setModal('novo')} style={{ color: VERDE }}
            className="hover:opacity-80 underline underline-offset-2">
            Registrar agora
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
              onEditar={setModal}
              onExcluir={excluir}
            />
          ))}
        </div>
      )}

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA ENTRADA' : 'EDITAR ENTRADA'} onClose={() => setModal(null)}>
          <FormEntrada inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}

      <FABButton cor="#00e676" onClick={() => setModal('novo')} posicao="center" />
    </div>
  )
}
