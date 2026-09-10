export default function PageHeader({ titulo, children }) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
      style={{ background: '#121212', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h1 className="font-bold text-white text-base">{titulo}</h1>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  )
}
