import { useApp } from '../context/AppContext'

export default function MonthPicker() {
  const { mesSelecionado, setMesSelecionado } = useApp()

  function anterior() {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    const d = new Date(ano, mes - 2)
    setMesSelecionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function proximo() {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    const d = new Date(ano, mes)
    setMesSelecionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [ano, mes] = mesSelecionado.split('-').map(Number)
  const label = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div className="flex items-center gap-1">
      <button onClick={anterior} className="text-accent hover:text-red-400 font-bold text-lg w-7 h-7 flex items-center justify-center">‹</button>
      <span className="font-display text-[10px] tracking-widest text-gray-300 capitalize min-w-[90px] text-center">{label}</span>
      <button onClick={proximo} className="text-accent hover:text-red-400 font-bold text-lg w-7 h-7 flex items-center justify-center">›</button>
    </div>
  )
}
