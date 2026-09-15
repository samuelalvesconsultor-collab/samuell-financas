import { useEffect, useRef, useState } from 'react'
import { useApp, CORES_STATUS_DEFAULT, CORES_FORMA_DEFAULT } from '../context/AppContext'
import { getCategorias, criarCategoria, atualizarCategoria, arquivarCategoria } from '../api/categorias'
import Modal from '../components/Modal'
import FormCategoria from '../components/FormCategoria'
import PageHeader from '../components/PageHeader'

const TIPO_LABEL = { entrada: 'Entrada', saida: 'Saída', ambos: 'Ambos' }
const TIPO_COR   = {
  entrada: 'text-teal-400 border-teal-800/40 bg-teal-900/20',
  saida:   'text-red-400 border-red-800/40 bg-red-900/20',
  ambos:   'text-gray-400 border-gray-700 bg-gray-800/30',
}

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const EyeIcon = ({ off }) => off ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

function SecaoTitulo({ label }) {
  return (
    <p className="text-[9px] font-bold tracking-[0.15em] text-gray-600 uppercase mb-3">{label}</p>
  )
}

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

function CatRow({ c, onEdit, onToggleArq, onMudarCor }) {
  const colorRef = useRef(null)
  return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'var(--card)', border: `1px solid ${c.cor ? c.cor + '30' : 'var(--card-border)'}` }}>
      <button
        type="button"
        onClick={() => colorRef.current?.click()}
        className="relative w-5 h-5 rounded-full shrink-0 cursor-pointer"
        style={{ background: c.cor || 'var(--card-border)', boxShadow: c.cor ? `0 0 6px ${c.cor}66` : 'none' }}
        title="Alterar cor"
      >
        <input
          ref={colorRef}
          type="color"
          value={c.cor || '#6b7280'}
          onChange={e => onMudarCor(c, e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full"
          style={{ fontSize: '16px' }}
          tabIndex={-1}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{c.nome}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => onEdit(c)} title="Editar" className="text-gray-600 hover:text-gray-300 transition-colors">
          <PencilIcon />
        </button>
        <button onClick={onToggleArq} title="Ocultar" className="text-gray-600 hover:text-yellow-400 transition-colors">
          <EyeIcon off={false} />
        </button>
      </div>
    </div>
  )
}

export default function Configuracoes({ onLogout }) {
  const { config, atualizarConfig, setCategorias } = useApp()

  // --- Cards state ---
  const [cards, setCards] = useState(config.dashboard_cards || [])
  const [editandoCard, setEditandoCard] = useState(null)
  const [tituloEditando, setTituloEditando] = useState('')
  const [salvandoCards, setSalvandoCards] = useState(false)

  useEffect(() => {
    setCards(config.dashboard_cards || [])
  }, [config.dashboard_cards])

  const cardsOrdenados = [...cards].sort((a, b) => a.ordem - b.ordem)

  async function salvarCards(novosCards) {
    setSalvandoCards(true)
    await atualizarConfig('dashboard_cards', novosCards)
    setCards(novosCards)
    setSalvandoCards(false)
  }

  function moverCard(idx, dir) {
    const arr = [...cardsOrdenados]
    const alvo = idx + dir
    if (alvo < 0 || alvo >= arr.length) return
    ;[arr[idx], arr[alvo]] = [arr[alvo], arr[idx]]
    const comOrdem = arr.map((c, i) => ({ ...c, ordem: i }))
    salvarCards(comOrdem)
  }

  function toggleVisivel(id) {
    const novos = cards.map(c => c.id === id ? { ...c, visivel: !c.visivel } : c)
    salvarCards(novos)
  }

  function iniciarEdicaoTitulo(card) {
    setEditandoCard(card.id)
    setTituloEditando(card.titulo)
  }

  function salvarTituloCard() {
    if (!tituloEditando.trim()) { setEditandoCard(null); return }
    const novos = cards.map(c => c.id === editandoCard ? { ...c, titulo: tituloEditando.trim() } : c)
    salvarCards(novos)
    setEditandoCard(null)
  }

  // --- Categorias state ---
  const [listaCats, setListaCats] = useState([])
  const [modalCat, setModalCat] = useState(null)
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)

  const carregarCats = async () => {
    if (mostrarArquivadas) {
      const [ativas, arq] = await Promise.all([getCategorias(false), getCategorias(true)])
      setListaCats([...ativas, ...arq]); setCategorias(ativas)
    } else {
      const data = await getCategorias(false)
      setListaCats(data); setCategorias(data)
    }
  }
  useEffect(() => { carregarCats() }, [mostrarArquivadas])

  async function salvarCat(dados) {
    if (modalCat === 'novo') await criarCategoria(dados)
    else await atualizarCategoria(modalCat.id, dados)
    setModalCat(null); carregarCats()
  }

  async function mudarCorCat(c, novaCor) {
    await atualizarCategoria(c.id, { nome: c.nome, tipo: c.tipo, cor: novaCor })
    carregarCats()
  }

  const catsAtivas     = listaCats.filter(c => !c.arquivada)
  const catsArquivadas = listaCats.filter(c => c.arquivada)
  const catsEntrada    = catsAtivas.filter(c => c.tipo === 'entrada' || c.tipo === 'ambos')
  const catsSaida      = catsAtivas.filter(c => c.tipo === 'saida'   || c.tipo === 'ambos')
  const isLight = config.tema === 'light'

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Configurações" />

      <div className="p-4 md:p-8 space-y-8 w-full max-w-4xl">

        {/* ── Seção 1: Aparência ─────────────────────── */}
        <section>
          <SecaoTitulo label="Aparência" />
          <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">Tema</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {isLight ? 'Modo claro ativado' : 'Modo escuro ativado'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${!isLight ? 'text-white' : 'text-gray-500'}`}>
                  <MoonIcon />
                </span>
                <button
                  onClick={() => atualizarConfig('tema', isLight ? 'dark' : 'light')}
                  className="relative w-11 h-6 rounded-full transition-colors duration-300"
                  style={{ background: isLight ? '#dc2626' : 'rgba(255,255,255,0.12)' }}
                  title="Alternar tema"
                >
                  <span
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                    style={{ transform: isLight ? 'translateX(21px)' : 'translateX(4px)' }}
                  />
                </button>
                <span className={`text-[10px] ${isLight ? 'text-yellow-400' : 'text-gray-500'}`}>
                  <SunIcon />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Seção 2: Cards do Dashboard ───────────── */}
        <section>
          <SecaoTitulo label="Cards do Dashboard" />
          <div className="space-y-2">
            {cardsOrdenados.map((card, idx) => (
              <div
                key={card.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  opacity: card.visivel ? 1 : 0.5,
                }}
              >
                {/* Seta cima/baixo */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moverCard(idx, -1)}
                    disabled={idx === 0 || salvandoCards}
                    className="text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors leading-none"
                    title="Mover para cima"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button
                    onClick={() => moverCard(idx, 1)}
                    disabled={idx === cardsOrdenados.length - 1 || salvandoCards}
                    className="text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors leading-none"
                    title="Mover para baixo"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                {/* Número de ordem */}
                <span className="text-[10px] text-gray-600 tabular-nums w-3 shrink-0">{idx + 1}</span>

                {/* Título (editável) */}
                <div className="flex-1 min-w-0">
                  {editandoCard === card.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={tituloEditando}
                        onChange={e => setTituloEditando(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvarTituloCard(); if (e.key === 'Escape') setEditandoCard(null) }}
                        className="input-dark flex-1 text-sm py-1 px-2"
                        style={{ background: 'var(--card-alt)' }}
                      />
                      <button onClick={salvarTituloCard} className="text-xs text-teal-400 hover:text-teal-300">Salvar</button>
                      <button onClick={() => setEditandoCard(null)} className="text-xs text-gray-600 hover:text-gray-400">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEdicaoTitulo(card)}
                      className="text-white text-sm text-left hover:text-gray-300 transition-colors group flex items-center gap-2"
                    >
                      {card.titulo}
                      <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Toggle visível */}
                <button
                  onClick={() => toggleVisivel(card.id)}
                  disabled={salvandoCards}
                  className={`shrink-0 transition-colors ${card.visivel ? 'text-gray-400 hover:text-gray-200' : 'text-gray-700 hover:text-gray-500'}`}
                  title={card.visivel ? 'Ocultar card' : 'Mostrar card'}
                >
                  <EyeIcon off={!card.visivel} />
                </button>
              </div>
            ))}
            <p className="text-[10px] text-gray-600 px-1 pt-1">
              Clique no título para renomear · use as setas para reordenar · olho para ocultar
            </p>
          </div>
        </section>

        {/* ── Seção 3: Cores dos Indicadores ─────────── */}
        <section>
          <SecaoTitulo label="Etiquetas dos Cards" />
          <p className="text-[10px] text-gray-600 mb-3 -mt-1 px-1">
            Olho para ocultar · círculo colorido para mudar a cor
          </p>
          <div className="space-y-4">
            {/* Status de pagamento */}
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold text-gray-400 mb-3">Tipo de pagamento</p>
              <div className="space-y-3">
                {[
                  { key: 'avista',     label: 'À vista'    },
                  { key: 'parcelado',  label: 'Parcelado'  },
                  { key: 'recorrente', label: 'Recorrente' },
                ].map(({ key, label }) => {
                  const coresAtual = config.badge_status_cores || CORES_STATUS_DEFAULT
                  const cor = coresAtual[key] || CORES_STATUS_DEFAULT[key]
                  const bv = config.badges_visiveis || {}
                  const visivel = bv[key] !== false
                  return (
                    <div key={key} className="flex items-center justify-between gap-3">
                      {/* Badge preview */}
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full transition-opacity"
                        style={{ background: `${cor}22`, border: `1px solid ${cor}44`, color: cor, opacity: visivel ? 1 : 0.35 }}>
                        {label}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Ocultar/Mostrar */}
                        <button
                          onClick={() => {
                            const nova = { ...(config.badges_visiveis || {}), [key]: !visivel }
                            atualizarConfig('badges_visiveis', nova)
                          }}
                          className={`transition-colors ${visivel ? 'text-gray-400 hover:text-gray-200' : 'text-gray-700 hover:text-gray-500'}`}
                          title={visivel ? 'Ocultar etiqueta' : 'Mostrar etiqueta'}
                        >
                          <EyeIcon off={!visivel} />
                        </button>
                        {/* Cor */}
                        <input
                          type="color"
                          value={cor}
                          onChange={e => {
                            const nova = { ...coresAtual, [key]: e.target.value }
                            atualizarConfig('badge_status_cores', nova)
                          }}
                          className="w-7 h-7 rounded cursor-pointer border-0 p-0.5"
                          style={{ background: 'var(--card-alt)' }}
                          title={`Cor: ${label}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Forma de pagamento */}
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs font-semibold text-gray-400 mb-3">Forma de pagamento</p>
              <div className="space-y-3">
                {[
                  { key: 'credito', label: 'Crédito' },
                  { key: 'boleto',  label: 'Boleto'  },
                  { key: 'pix',     label: 'PIX'     },
                ].map(({ key, label }) => {
                  const coresAtual = config.badge_forma_cores || CORES_FORMA_DEFAULT
                  const cor = coresAtual[key] || CORES_FORMA_DEFAULT[key]
                  const bv = config.badges_visiveis || {}
                  const visivel = bv[key] !== false
                  return (
                    <div key={key} className="flex items-center justify-between gap-3">
                      {/* Badge preview */}
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full transition-opacity"
                        style={{ background: `${cor}22`, border: `1px solid ${cor}44`, color: cor, opacity: visivel ? 1 : 0.35 }}>
                        {label}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Ocultar/Mostrar */}
                        <button
                          onClick={() => {
                            const nova = { ...(config.badges_visiveis || {}), [key]: !visivel }
                            atualizarConfig('badges_visiveis', nova)
                          }}
                          className={`transition-colors ${visivel ? 'text-gray-400 hover:text-gray-200' : 'text-gray-700 hover:text-gray-500'}`}
                          title={visivel ? 'Ocultar etiqueta' : 'Mostrar etiqueta'}
                        >
                          <EyeIcon off={!visivel} />
                        </button>
                        {/* Cor */}
                        <input
                          type="color"
                          value={cor}
                          onChange={e => {
                            const nova = { ...coresAtual, [key]: e.target.value }
                            atualizarConfig('badge_forma_cores', nova)
                          }}
                          className="w-7 h-7 rounded cursor-pointer border-0 p-0.5"
                          style={{ background: 'var(--card-alt)' }}
                          title={`Cor: ${label}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Seção 5: Categorias ────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SecaoTitulo label="Categorias" />
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mostrarArquivadas}
                  onChange={e => setMostrarArquivadas(e.target.checked)}
                  className="accent-red-600"
                />
                Ocultas
              </label>
              <button onClick={() => setModalCat('novo')} className="btn-action text-xs px-3 py-1.5">
                + Nova
              </button>
            </div>
          </div>

          {!catsAtivas.length && !catsArquivadas.length ? (
            <div className="text-center py-10 text-gray-600 text-sm rounded-xl"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            <div className="space-y-5">

              {/* Grupo: Entradas */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2 px-1" style={{ color: '#14b8a6' }}>
                  Entradas
                </p>
                {catsEntrada.length === 0 ? (
                  <div className="text-xs py-4 text-center rounded-xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text-faint)' }}>
                    Nenhuma categoria de entrada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catsEntrada.map(c => (
                      <CatRow
                        key={c.id}
                        c={c}
                        onEdit={setModalCat}
                        onToggleArq={() => arquivarCategoria(c.id).then(carregarCats)}
                        onMudarCor={mudarCorCat}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Grupo: Saídas */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2 px-1" style={{ color: '#ef4444' }}>
                  Saídas
                </p>
                {catsSaida.length === 0 ? (
                  <div className="text-xs py-4 text-center rounded-xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text-faint)' }}>
                    Nenhuma categoria de saída
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catsSaida.map(c => (
                      <CatRow
                        key={c.id}
                        c={c}
                        onEdit={setModalCat}
                        onToggleArq={() => arquivarCategoria(c.id).then(carregarCats)}
                        onMudarCor={mudarCorCat}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Grupo: Ocultas */}
              {mostrarArquivadas && catsArquivadas.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2 px-1" style={{ color: 'var(--text-faint)' }}>
                    Ocultas
                  </p>
                  <div className="space-y-2">
                    {catsArquivadas.map(c => (
                      <div key={c.id} className="rounded-xl px-4 py-3 flex items-center gap-3 opacity-50"
                        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                        <div className="w-4 h-4 rounded-full shrink-0"
                          style={{ background: c.cor || 'var(--card-border)' }} />
                        <p className="flex-1 text-sm line-through truncate" style={{ color: 'var(--text-muted)' }}>{c.nome}</p>
                        <button
                          onClick={() => arquivarCategoria(c.id).then(carregarCats)}
                          className="text-teal-600 hover:text-teal-400 text-xs shrink-0 transition-colors">
                          Mostrar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* ── Seção 6: Conta (sempre por último) ─────── */}
        {onLogout && (
          <section>
            <SecaoTitulo label="Conta" />
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Sair da conta</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Encerra a sessão atual</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.1)'}
                >
                  <LogoutIcon />
                  Sair
                </button>
              </div>
            </div>
          </section>
        )}

      </div>

      {modalCat && (
        <Modal titulo={modalCat === 'novo' ? 'NOVA CATEGORIA' : 'EDITAR CATEGORIA'} onClose={() => setModalCat(null)}>
          <FormCategoria inicial={modalCat !== 'novo' ? modalCat : undefined} onSalvar={salvarCat} onCancelar={() => setModalCat(null)} />
        </Modal>
      )}
    </div>
  )
}
