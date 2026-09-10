const CONFIG = {
  pago:     { dot: 'bg-teal-500',   label: 'Pago' },
  paga:     { dot: 'bg-teal-500',   label: 'Paga' },
  pendente: { dot: 'bg-yellow-500', label: 'Pendente' },
  atrasada: { dot: 'bg-red-500',    label: 'Atrasada' },
  atrasado: { dot: 'bg-red-500',    label: 'Atrasado' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { dot: 'bg-gray-500', label: status }
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
