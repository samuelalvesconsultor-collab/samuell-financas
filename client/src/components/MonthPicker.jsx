import { useApp } from '../context/AppContext'

export default function MonthPicker() {
  const { mesSelecionado, setMesSelecionado } = useApp()

  function mover(delta) {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    const d = new Date(ano, mes - 1 + delta)
    setMesSelecionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [ano, mes] = mesSelecionado.split('-').map(Number)
  const label = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div
      className="flex items-center gap-1 rounded-lg px-2 py-1"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button onClick={() => mover(-1)} className="text-red-500 hover:text-red-400 w-6 h-6 flex items-center justify-center font-bold text-base transition-colors">‹</button>
      <span className="font-display text-[10px] tracking-widest text-gray-300 capitalize min-w-[88px] text-center">{label}</span>
      <button onClick={() => mover(1)}  className="text-red-500 hover:text-red-400 w-6 h-6 flex items-center justify-center font-bold text-base transition-colors">›</button>
    </div>
  )
}
