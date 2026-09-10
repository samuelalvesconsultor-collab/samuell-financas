import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDashboard } from '../api/dashboard'
import SaldoCard from '../components/SaldoCard'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CORES = ['#1e40af','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#be185d','#65a30d']

export default function Dashboard() {
  const { mesSelecionado } = useApp()
  const [dados, setDados] = useState(null)

  useEffect(() => {
    getDashboard(mesSelecionado).then(setDados)
  }, [mesSelecionado])

  if (!dados) return <div className="p-4 text-gray-500">Carregando...</div>

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <MonthPicker />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SaldoCard label="Entradas" valor={dados.total_entradas} cor="verde" />
        <SaldoCard label="Saídas" valor={dados.total_saidas} cor="vermelho" />
        <SaldoCard label="Saldo" valor={dados.saldo} cor={dados.saldo >= 0 ? 'azul' : 'vermelho'} />
      </div>

      {dados.contas_atrasadas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-red-700 mb-2">Contas atrasadas</h2>
          {dados.contas_atrasadas.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1">
              <span className="text-sm text-red-800">{c.descricao}</span>
              <StatusBadge status="atrasada" />
            </div>
          ))}
        </div>
      )}

      {dados.contas_proximas.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-yellow-700 mb-2">Vencendo em breve</h2>
          {dados.contas_proximas.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1">
              <span className="text-sm text-yellow-800">{c.descricao}</span>
              <span className="text-sm font-medium text-yellow-900">
                {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {dados.gastos_por_categoria.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Gastos por categoria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={dados.gastos_por_categoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={80}>
                {dados.gastos_por_categoria.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {dados.gastos_por_categoria.map((g, i) => (
              <div key={g.categoria} className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: CORES[i % CORES.length] }} />
                  {g.categoria || 'Sem categoria'}
                </span>
                <span className="font-medium">
                  {Number(g.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
