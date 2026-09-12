export default function PageHeader({ titulo, children }) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-y-2 px-4 md:px-8 py-3 md:py-5 sticky top-0 z-10"
      style={{
        background: 'var(--glass-header)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--card-border)',
      }}
    >
      <h1 className="font-bold text-sm md:text-lg tracking-tight" style={{ color: 'var(--text)' }}>{titulo}</h1>
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">{children}</div>
    </header>
  )
}
