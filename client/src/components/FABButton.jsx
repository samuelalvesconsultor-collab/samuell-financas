import { useEffect, useState } from 'react'

export default function FABButton({ cor, onClick, posicao = 'left' }) {
  const [scrollando, setScrollando] = useState(false)

  useEffect(() => {
    let timer
    const onScroll = () => {
      setScrollando(true)
      clearTimeout(timer)
      timer = setTimeout(() => setScrollando(false), 800)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  }, [])

  const posLeft = posicao === 'center' ? '50%' : '1rem'
  const transform = posicao === 'center' ? 'translateX(-50%)' : 'none'

  return (
    <button
      onClick={onClick}
      className="fixed z-40 flex items-center justify-center rounded-full active:scale-95 w-[52px] h-[52px] transition-opacity duration-300"
      style={{
        background: cor,
        boxShadow: `0 4px 20px ${cor}70`,
        opacity: scrollando ? 0.25 : 1,
        bottom: 'var(--fab-bottom)',
        left: posLeft,
        transform,
      }}
      aria-label="Novo registro"
    >
      <span className="text-white text-2xl leading-none select-none font-light">+</span>
    </button>
  )
}
