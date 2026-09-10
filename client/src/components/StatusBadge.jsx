const styles = {
  pago:     'bg-teal-900/30 text-teal-400 border border-teal-700/40',
  paga:     'bg-teal-900/30 text-teal-400 border border-teal-700/40',
  pendente: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/40',
  atrasada: 'bg-red-900/30 text-red-400 border border-red-700/40',
  atrasado: 'bg-red-900/30 text-red-400 border border-red-700/40',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[status] || 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
      {status}
    </span>
  )
}
