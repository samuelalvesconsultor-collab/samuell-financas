import { useEffect, useState } from 'react'

export default function FABButton({ cor, onClick, posicao = 'left', scrollAware = false }) {
  const [visivel, setVisivel] = useState(true)

  useEffect(() => {
    if (!scrollAware) return
    let timer
    const onScroll = () => {
      setVisivel(false)
      clearTimeout(timer)
      timer = setTimeout(() => setVisivel(true), 800)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  }, [scrollAware])

  const posClass = posicao === 'center'
    ? 'bottom-[5.5rem] left-1/2 -translate-x-1/2 md:bottom-6 md:left-1/2 md:-translate-x-1/2'
    : 'bottom-[5.5rem] left-4 md:bottom-6 md:left-[4.5rem]'

  return (
    <button
      onClick={onClick}
      className={`fixed z-40 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 w-[52px] h-[52px] ${posClass}`}
      style={{
        background: cor,
        boxShadow: `0 4px 20px ${cor}70`,
        opacity: scrollAware && !visivel ? 0.25 : 1,
      }}
      aria-label="Novo registro"
    >
      <span className="text-white text-2xl leading-none select-none font-light">+</span>
    </button>
  )
}
