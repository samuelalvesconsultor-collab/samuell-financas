export default function SaldoCard({ label, valor, cor }) {
  const cores = {
    verde:    'bg-tpetrol/10 border-tpetrol/30 text-teal-400 shadow-[0_0_20px_rgba(13,148,136,0.08)]',
    vermelho: 'bg-accent/10 border-accent/30 text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.08)]',
    azul:     'bg-slate-800/60 border-slate-600/40 text-slate-300',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${cores[cor] || cores.azul}`}>
      <span className="text-xs uppercase tracking-widest opacity-60 font-medium">{label}</span>
      <span className="text-xl font-bold tabular-nums">
        {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    </div>
  )
}
