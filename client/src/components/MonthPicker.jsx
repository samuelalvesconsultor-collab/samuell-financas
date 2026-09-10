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
  const label = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center gap-3">
      <button onClick={anterior} className="text-blue-700 font-bold text-lg px-2">‹</button>
      <span className="capitalize font-semibold text-gray-700">{label}</span>
      <button onClick={proximo} className="text-blue-700 font-bold text-lg px-2">›</button>
    </div>
  )
}
