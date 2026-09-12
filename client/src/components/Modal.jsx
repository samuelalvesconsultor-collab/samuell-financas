import { useEffect, useRef } from 'react'

export default function Modal({ titulo, onClose, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Ajusta altura do painel quando o teclado virtual aparece (iOS / Android)
    const vv = window.visualViewport
    function ajustar() {
      if (!panelRef.current || !vv) return
      const alturaDisp = vv.height
      panelRef.current.style.maxHeight = `${Math.min(alturaDisp * 0.92, alturaDisp - 16)}px`
    }
    ajustar()
    vv?.addEventListener('resize', ajustar)
    vv?.addEventListener('scroll', ajustar)

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prev
      vv?.removeEventListener('resize', ajustar)
      vv?.removeEventListener('scroll', ajustar)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 overflow-y-auto overscroll-contain"
        style={{
          background: 'rgba(22,22,22,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '85dvh',
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-[11px] tracking-widest text-white">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
