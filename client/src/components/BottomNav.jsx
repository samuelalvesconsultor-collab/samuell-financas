import { NavLink } from 'react-router-dom'

const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="8" height="8" rx="1.5"/>
    <rect x="13" y="3" width="8" height="8" rx="1.5"/>
    <rect x="3" y="13" width="8" height="8" rx="1.5"/>
    <rect x="13" y="13" width="8" height="8" rx="1.5"/>
  </svg>
)
const ArrowsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const CardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)

const links = [
  { to: '/',            label: 'Dashboard',   Icon: DashIcon   },
  { to: '/lancamentos', label: 'Entradas',    Icon: ArrowsIcon },
  { to: '/contas',      label: 'Contas',      Icon: ListIcon   },
  { to: '/dividas',     label: 'Dívidas',     Icon: CardIcon   },
  { to: '/categorias',  label: 'Categorias',  Icon: TagIcon    },
]

const BORDER = '1px solid rgba(255,255,255,0.06)'

export default function Nav() {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-52 z-50"
        style={{ background: '#0d0d0d', borderRight: BORDER }}
      >
        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: BORDER }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 tracking-tight">SF</div>
            <div>
              <p className="text-white text-[11px] font-bold leading-none tracking-wide">SAMUELL</p>
              <p className="text-white text-[11px] font-bold leading-none tracking-wide mt-0.5">FINANÇAS</p>
            </div>
          </div>
          <p className="text-red-500 text-[10px] ml-[42px] tracking-wider">Gestão Pessoal</p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col flex-1 p-3 gap-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-600 uppercase px-3 py-2 mt-1">Principal</p>
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(220,38,38,0.15)', borderLeft: '2px solid #dc2626', paddingLeft: '10px' }
                  : { paddingLeft: '12px' }
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: BORDER }}>
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              S
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">Samuel Alves</p>
              <p className="text-gray-600 text-[10px]">Pessoal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex z-50"
        style={{ background: '#0d0d0d', borderTop: BORDER }}
      >
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                isActive ? 'text-red-500' : 'text-gray-600'
              }`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
