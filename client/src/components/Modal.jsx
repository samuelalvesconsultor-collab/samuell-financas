import { useEffect } from 'react'

export default function Modal({ titulo, onClose, children }) {
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50"
      style={{ background: 'var(--backdrop)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 overflow-y-auto overscroll-contain"
        style={{
          background: 'var(--modal-surface)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--card-border)',
          maxHeight: '85svh',
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-[11px] tracking-widest" style={{ color: 'var(--text)' }}>{titulo}</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
