import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import Dividas from './pages/Dividas'
import Categorias from './pages/Categorias'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="pb-16 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/dividas" element={<Dividas />} />
            <Route path="/categorias" element={<Categorias />} />
          </Routes>
        </div>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  )
}
