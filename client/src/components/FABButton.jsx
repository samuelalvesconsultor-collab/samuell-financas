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

  const posClass = posicao === 'center'
    ? 'bottom-[5.5rem] left-1/2 -translate-x-1/2 md:bottom-6 md:left-1/2 md:-translate-x-1/2'
    : 'bottom-[5.5rem] left-4 md:bottom-6 md:left-[4.5rem]'

  return (
    <button
      onClick={onClick}
      className={`fixed z-40 flex items-center justify-center rounded-full active:scale-95 w-[52px] h-[52px] transition-opacity duration-300 ${posClass}`}
      style={{
        background: cor,
        boxShadow: `0 4px 20px ${cor}70`,
        opacity: scrollando ? 0.25 : 1,
      }}
      aria-label="Novo registro"
    >
      <span className="text-white text-2xl leading-none select-none font-light">+</span>
    </button>
  )
}
