import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const mesLabel = s => MESES_PT[parseInt(s.split('-')[1]) - 1]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text)' }}>
      <p className="text-gray-500 mb-1">{mesLabel(label)}</p>
      <p className="font-bold tabular-nums">{BRL(payload[0].value)}</p>
    </div>
  )
}

export default function GraficoMensal({ titulo, dados, dataKey, cor, gradientId }) {
  const total = (dados || []).reduce((s, d) => s + Number(d[dataKey] || 0), 0)
  const id = gradientId || `grad-${dataKey}`

  return (
    <div className="rounded-xl p-4 flex-1 min-w-0 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      {titulo && (
        <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: cor }}>
          {titulo}
        </p>
      )}
      <div className="flex-1 overflow-x-auto">
        <div style={{ minWidth: 420 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dados} barSize={10} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={cor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--divider)" />
              <XAxis dataKey="mes" tickFormatter={mesLabel} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--divider)' }} />
              <Bar dataKey={dataKey} fill={`url(#${id})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-3 pt-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--divider)' }}>
        <span className="text-[10px] text-gray-600 uppercase tracking-widest">Total acumulado</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: cor }}>{BRL(total)}</span>
      </div>
    </div>
  )
}
