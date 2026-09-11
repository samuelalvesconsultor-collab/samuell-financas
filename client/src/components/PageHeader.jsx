export default function PageHeader({ titulo, children }) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-y-2 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10"
      style={{ background: '#121212', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h1 className="font-bold text-white text-sm md:text-base">{titulo}</h1>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </header>
  )
}
