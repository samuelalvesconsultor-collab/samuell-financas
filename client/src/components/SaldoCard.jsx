export default function SaldoCard({ label, valor, cor }) {
  const cores = {
    verde:    'bg-green-50 border-green-200 text-green-700',
    vermelho: 'bg-red-50 border-red-200 text-red-700',
    azul:     'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${cores[cor] || cores.azul}`}>
      <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-2xl font-bold">
        {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    </div>
  )
}
