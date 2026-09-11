import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
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

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

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

  const catsAtivas     = listaCats.filter(c => !c.arquivada)
  const catsArquivadas = listaCats.filter(c => c.arquivada)
  const isLight = config.tema === 'light'

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <PageHeader titulo="Configurações" />

      <div className="p-4 md:p-6 space-y-8 max-w-2xl">

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

        {/* ── Seção 3: Conta ────────────────────────── */}
        {onLogout && (
          <section>
            <SecaoTitulo label="Conta" />
            <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">Sair da conta</p>
                  <p className="text-gray-500 text-xs mt-0.5">Encerra a sessão atual</p>
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

        {/* ── Seção 4: Categorias ────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SecaoTitulo label="Categorias" />
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mostrarArquivadas}
                  onChange={e => setMostrarArquivadas(e.target.checked)}
                  className="accent-red-600"
                />
                Arquivadas
              </label>
              <button onClick={() => setModalCat('novo')} className="btn-action text-xs px-3 py-1.5">
                + Nova
              </button>
            </div>
          </div>

          {!listaCats.length ? (
            <div className="text-center py-10 text-gray-600 text-sm rounded-xl"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--card-border)' }}>
                <table className="w-full text-sm">
                  <thead style={{ background: 'var(--card-alt)' }}>
                    <tr>
                      <th className="th">Nome</th>
                      <th className="th">Tipo</th>
                      <th className="th">Padrão</th>
                      <th className="th" />
                    </tr>
                  </thead>
                  <tbody style={{ background: 'var(--card)' }}>
                    {catsAtivas.map(c => (
                      <tr key={c.id} className="table-row">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            {c.cor
                              ? <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.cor, boxShadow: `0 0 6px ${c.cor}88` }} />
                              : <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--card-border)' }} />
                            }
                            <span className="text-white font-medium">{c.nome}</span>
                          </div>
                        </td>
                        <td className="td text-gray-500">{TIPO_LABEL[c.tipo]}</td>
                        <td className="td">
                          {c.padrao && <span className="text-[10px] text-yellow-400 border border-yellow-800/40 bg-yellow-900/20 px-2 py-0.5 rounded-full">Padrão</span>}
                        </td>
                        <td className="td text-right whitespace-nowrap">
                          <button onClick={() => setModalCat(c)} className="text-gray-600 hover:text-gray-300 text-xs mr-4 transition-colors">Editar</button>
                          <button onClick={() => arquivarCategoria(c.id).then(carregarCats)} className="text-gray-600 hover:text-yellow-400 text-xs transition-colors">Arquivar</button>
                        </td>
                      </tr>
                    ))}
                    {mostrarArquivadas && catsArquivadas.map(c => (
                      <tr key={c.id} className="table-row opacity-40">
                        <td className="td text-gray-500 line-through">{c.nome}</td>
                        <td className="td text-gray-600">{TIPO_LABEL[c.tipo]}</td>
                        <td className="td" />
                        <td className="td text-right">
                          <button onClick={() => arquivarCategoria(c.id).then(carregarCats)} className="text-teal-600 hover:text-teal-400 text-xs transition-colors">Restaurar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-2">
                {catsAtivas.map(c => (
                  <div key={c.id} className="rounded-xl p-4 flex items-center justify-between gap-3"
                    style={{ background: 'var(--card)', border: `1px solid ${c.cor ? c.cor + '40' : 'var(--card-border)'}` }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {c.cor && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.cor, boxShadow: `0 0 6px ${c.cor}88` }} />}
                        <p className="text-white font-medium text-sm truncate">{c.nome}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] border px-2 py-0.5 rounded-full ${TIPO_COR[c.tipo]}`}>
                          {TIPO_LABEL[c.tipo]}
                        </span>
                        {c.padrao && <span className="text-[10px] text-yellow-400 border border-yellow-800/40 bg-yellow-900/20 px-2 py-0.5 rounded-full">Padrão</span>}
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={() => setModalCat(c)} className="text-gray-600 hover:text-gray-300 text-xs transition-colors">Editar</button>
                      <button onClick={() => arquivarCategoria(c.id).then(carregarCats)} className="text-gray-600 hover:text-yellow-400 text-xs transition-colors">Arquivar</button>
                    </div>
                  </div>
                ))}
                {mostrarArquivadas && catsArquivadas.map(c => (
                  <div key={c.id} className="rounded-xl p-4 flex items-center justify-between gap-3 opacity-40"
                    style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                    <p className="text-gray-500 line-through text-sm truncate">{c.nome}</p>
                    <button onClick={() => arquivarCategoria(c.id).then(carregarCats)} className="text-teal-600 hover:text-teal-400 text-xs shrink-0 transition-colors">Restaurar</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

      </div>

      {modalCat && (
        <Modal titulo={modalCat === 'novo' ? 'NOVA CATEGORIA' : 'EDITAR CATEGORIA'} onClose={() => setModalCat(null)}>
          <FormCategoria inicial={modalCat !== 'novo' ? modalCat : undefined} onSalvar={salvarCat} onCancelar={() => setModalCat(null)} />
        </Modal>
      )}
    </div>
  )
}
