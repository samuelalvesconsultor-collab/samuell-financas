const styles = {
  pago:     'bg-green-100 text-green-800',
  paga:     'bg-green-100 text-green-800',
  pendente: 'bg-yellow-100 text-yellow-800',
  atrasada: 'bg-red-100 text-red-800',
  atrasado: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
