import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDashboard } from '../api/dashboard'
import SaldoCard from '../components/SaldoCard'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CORES = ['#dc2626','#0d9488','#d97706','#7c3aed','#0891b2','#be185d','#65a30d','#6b7280']

export default function Dashboard() {
  const { mesSelecionado } = useApp()
  const [dados, setDados] = useState(null)

  useEffect(() => {
    getDashboard(mesSelecionado).then(setDados)
  }, [mesSelecionado])

  if (!dados) return <div className="p-4 text-muted">Carregando...</div>

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4">
        <h1 className="font-display text-sm tracking-widest text-gray-200 uppercase">Dashboard</h1>
        <MonthPicker />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SaldoCard label="Entradas" valor={dados.total_entradas} cor="verde" />
        <SaldoCard label="Saídas"   valor={dados.total_saidas}   cor="vermelho" />
        <SaldoCard label="Saldo"    valor={dados.saldo}           cor={dados.saldo >= 0 ? 'azul' : 'vermelho'} />
      </div>

      {dados.contas_atrasadas.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
          <h2 className="text-xs font-display tracking-widest text-red-400 mb-3 uppercase">Contas Atrasadas</h2>
          {dados.contas_atrasadas.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1.5 border-b border-red-900/20 last:border-0">
              <span className="text-sm text-red-200">{c.descricao}</span>
              <StatusBadge status="atrasada" />
            </div>
          ))}
        </div>
      )}

      {dados.contas_proximas.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
          <h2 className="text-xs font-display tracking-widest text-yellow-400 mb-3 uppercase">Vencendo em Breve</h2>
          {dados.contas_proximas.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1.5 border-b border-yellow-900/20 last:border-0">
              <span className="text-sm text-yellow-200">{c.descricao}</span>
              <span className="text-sm font-medium text-yellow-300">
                {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {dados.gastos_por_categoria.length > 0 && (
        <div className="card-dark p-4">
          <h2 className="text-xs font-display tracking-widest text-muted mb-4 uppercase">Gastos por Categoria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={dados.gastos_por_categoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} stroke="none">
                {dados.gastos_por_categoria.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#2a2a2f', border: '1px solid #3a3a40', borderRadius: 8, color: '#f0f0f0' }}
                formatter={v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {dados.gastos_por_categoria.map((g, i) => (
              <div key={g.categoria} className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CORES[i % CORES.length] }} />
                  {g.categoria || 'Sem categoria'}
                </span>
                <span className="font-medium text-gray-100 tabular-nums">
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
