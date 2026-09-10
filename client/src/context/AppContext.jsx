import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const now = new Date()
  const [mesSelecionado, setMesSelecionado] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(setCategorias)
  }, [])

  return (
    <AppContext.Provider value={{ mesSelecionado, setMesSelecionado, categorias, setCategorias }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
