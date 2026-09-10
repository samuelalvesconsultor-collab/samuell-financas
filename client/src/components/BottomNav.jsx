import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/lancamentos', label: 'Lançamentos', icon: '💰' },
  { to: '/contas', label: 'Contas', icon: '📋' },
  { to: '/dividas', label: 'Dívidas', icon: '💳' },
  { to: '/categorias', label: 'Categorias', icon: '🏷️' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-500'}`
          }
        >
          <span className="text-xl">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
