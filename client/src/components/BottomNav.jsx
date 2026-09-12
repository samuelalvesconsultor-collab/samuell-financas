import { useState } from 'react'
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
const GearIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)

const links = [
  { to: '/',            label: 'Dashboard', Icon: DashIcon   },
  { to: '/lancamentos', label: 'Entradas',  Icon: ArrowsIcon },
  { to: '/contas',      label: 'Contas',    Icon: ListIcon   },
  { to: '/dividas',     label: 'Dívidas',   Icon: CardIcon   },
]

// Mobile inclui Config pois não tem rodapé com ícone
const linksMobile = [
  ...links,
  { to: '/configuracoes', label: 'Config', Icon: GearIcon },
]

export default function Nav() {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50 overflow-hidden transition-all duration-300"
        style={{
          width: expanded ? '208px' : '56px',
          background: 'var(--bg)',
          borderRight: '1px solid var(--card-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--card-border)', minHeight: '72px' }}>
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 tracking-tight">
            SF
          </div>
          <div className="overflow-hidden whitespace-nowrap transition-opacity duration-200"
            style={{ opacity: expanded ? 1 : 0 }}>
            <p className="text-white text-[11px] font-bold leading-none tracking-wide">SAMUELL</p>
            <p className="text-white text-[11px] font-bold leading-none tracking-wide mt-0.5">FINANÇAS</p>
            <p className="text-red-500 text-[10px] tracking-wider mt-1">Gestão Pessoal</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col flex-1 px-2 py-3 gap-0.5 overflow-y-auto overflow-x-hidden">
          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-600 uppercase px-3 py-2 mt-1 whitespace-nowrap overflow-hidden transition-opacity duration-200"
            style={{ opacity: expanded ? 1 : 0 }}>
            Principal
          </p>
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap overflow-hidden ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(220,38,38,0.15)', borderLeft: '2px solid #dc2626', paddingLeft: '10px' }
                  : { paddingLeft: '12px' }
              }
            >
              <span className="shrink-0"><Icon /></span>
              <span className="transition-opacity duration-200" style={{ opacity: expanded ? 1 : 0 }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 py-3 shrink-0" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg overflow-hidden"
            style={{ background: 'var(--chip-bg)' }}>
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              S
            </div>
            <div className="flex-1 min-w-0 whitespace-nowrap transition-opacity duration-200"
              style={{ opacity: expanded ? 1 : 0 }}>
              <p className="text-white text-xs font-medium truncate">Samuel Alves</p>
              <p className="text-gray-600 text-[10px]">Pessoal</p>
            </div>
            <NavLink
              to="/configuracoes"
              title="Configurações"
              className={({ isActive }) =>
                `shrink-0 transition-all duration-200 ${isActive ? 'text-red-400' : 'text-gray-600 hover:text-gray-300'}`
              }
              style={{ opacity: expanded ? 1 : 0, pointerEvents: expanded ? 'auto' : 'none' }}
            >
              <GearIcon />
            </NavLink>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex z-50"
        style={{
          background: 'var(--glass-nav)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTop: '1px solid var(--card-border)',
        }}
      >
        {linksMobile.map(({ to, label, Icon }) => (
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
