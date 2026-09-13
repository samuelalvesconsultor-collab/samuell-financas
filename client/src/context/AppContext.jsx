import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getConfiguracoes, patchConfiguracao } from '../api/configuracoes'
import { fetchAuth } from '../api/client'

const AppContext = createContext()

export const CORES_STATUS_DEFAULT = { avista: '#14b8a6', parcelado: '#f97316', recorrente: '#8b5cf6' }
export const CORES_FORMA_DEFAULT  = { credito: '#3b82f6', boleto: '#f59e0b', pix: '#10b981' }

const CARDS_PADRAO = [
  { id: 'entrada_mes',      titulo: 'Entrada do Mês',    visivel: true, ordem: 0 },
  { id: 'contas_pagas',     titulo: 'Contas Pagas',      visivel: true, ordem: 1 },
  { id: 'contas_pendentes', titulo: 'Contas Pendentes',  visivel: true, ordem: 2 },
]

export function AppProvider({ children }) {
  const now = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [categorias, setCategorias] = useState([])
  const [config, setConfig] = useState({ tema: 'dark', dashboard_cards: CARDS_PADRAO })

  useEffect(() => {
    fetchAuth('/api/categorias')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategorias(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getConfiguracoes()
      .then(data => {
        setConfig(c => ({
          ...c,
          ...data,
          tema: data.tema || 'dark',
          dashboard_cards: Array.isArray(data.dashboard_cards) && data.dashboard_cards.length > 0
            ? data.dashboard_cards
            : CARDS_PADRAO,
          badge_status_cores: data.badge_status_cores || CORES_STATUS_DEFAULT,
          badge_forma_cores:  data.badge_forma_cores  || CORES_FORMA_DEFAULT,
        }))
      })
      .catch(() => {})
  }, [])

  const primeiroRender = useRef(true)
  useEffect(() => {
    const el = document.documentElement
    if (!primeiroRender.current) {
      el.classList.add('theme-transitioning')
      setTimeout(() => el.classList.remove('theme-transitioning'), 450)
    }
    primeiroRender.current = false
    config.tema === 'light' ? el.classList.add('light') : el.classList.remove('light')
  }, [config.tema])

  async function atualizarConfig(chave, valor) {
    try {
      await patchConfiguracao(chave, valor)
      setConfig(c => ({ ...c, [chave]: valor }))
    } catch (err) {
      console.error('Erro ao salvar configuração:', err)
    }
  }

  return (
    <AppContext.Provider value={{
      mesSelecionado, setMesSelecionado,
      categorias, setCategorias,
      config, atualizarConfig,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
