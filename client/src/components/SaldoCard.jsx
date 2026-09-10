const CORES = {
  verde:    { border: 'rgba(13,148,136,0.2)',  text: '#14b8a6', under: '#0d9488', bg: 'rgba(13,148,136,0.06)'  },
  vermelho: { border: 'rgba(220,38,38,0.2)',   text: '#f87171', under: '#dc2626', bg: 'rgba(220,38,38,0.06)'   },
  azul:     { border: 'rgba(255,255,255,0.08)', text: '#9ca3af', under: '#6b7280', bg: 'rgba(255,255,255,0.03)' },
}

export default function SaldoCard({ label, valor, cor }) {
  const c = CORES[cor] || CORES.azul
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div>
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#6b7280' }}>{label}</span>
        <div className="h-0.5 w-6 mt-1 rounded-full" style={{ background: c.under }} />
      </div>
      <span className="font-display text-lg font-bold tabular-nums" style={{ color: c.text }}>
        {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    </div>
  )
}
