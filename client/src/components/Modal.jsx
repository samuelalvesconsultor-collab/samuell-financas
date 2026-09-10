import { useEffect } from 'react'

export default function Modal({ titulo, onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-[11px] tracking-widest text-white">{titulo}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-2xl leading-none transition-colors">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
