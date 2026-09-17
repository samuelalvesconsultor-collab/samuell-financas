import { useState } from 'react'

/* ── Utilitários de PIN (exportados para uso nas Configurações) ── */

const HASH_KEY    = 'sf_pin_hash'
const SESSION_KEY = 'sf_unlocked'

export async function hashPin(pin) {
  const data = new TextEncoder().encode(pin + 'sf_salt_2024')
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verificarPin(pin) {
  const hash = await hashPin(pin)
  return hash === localStorage.getItem(HASH_KEY)
}

export async function definirPin(pin) {
  const hash = await hashPin(pin)
  localStorage.setItem(HASH_KEY, hash)
}

export function removerPin() {
  localStorage.removeItem(HASH_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export function pinAtivo() {
  return !!localStorage.getItem(HASH_KEY)
}

export function marcarDesbloqueado() {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function estaDesbloqueado() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

/* ── Numpad compartilhado ──────────────────────────────────────── */

export function PinPad({ pin, setPin, onComplete, erro }) {
  function pressDigit(d) {
    if (pin.length >= 4) return
    const novo = pin + d
    setPin(novo)
    if (novo.length === 4 && onComplete) onComplete(novo)
  }

  function apagar() {
    setPin(p => p.slice(0, -1))
  }

  const teclas = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫']

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dots */}
      <div className={`flex gap-4 ${erro ? 'pin-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all duration-150"
            style={{
              background: i < pin.length ? '#dc2626' : 'rgba(255,255,255,0.08)',
              border: '2px solid rgba(255,255,255,0.18)',
              boxShadow: i < pin.length ? '0 0 8px rgba(220,38,38,0.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {teclas.map((d, idx) =>
          d === null ? (
            <div key={idx} />
          ) : (
            <button
              key={idx}
              onClick={() => (d === '⌫' ? apagar() : pressDigit(String(d)))}
              className="h-16 rounded-2xl text-xl font-semibold text-white transition-all duration-100 active:scale-90 select-none"
              style={{
                background: d === '⌫' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {d}
            </button>
          )
        )}
      </div>
    </div>
  )
}

/* ── Tela de bloqueio ──────────────────────────────────────────── */

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)
  const [tentativas, setTentativas] = useState(0)

  async function verificar(digitos) {
    const ok = await verificarPin(digitos)
    if (ok) {
      marcarDesbloqueado()
      onUnlock()
    } else {
      setErro(true)
      setTentativas(t => t + 1)
      setTimeout(() => { setErro(false); setPin('') }, 650)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: 'var(--surface, #0d0d0d)' }}
    >
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-xl mb-4 select-none"
        style={{ boxShadow: '0 0 32px rgba(220,38,38,0.4)' }}>
        SF
      </div>
      <p className="text-white font-bold text-lg tracking-wide mb-1 select-none">Samuell Finanças</p>
      <p className="text-gray-500 text-sm mb-10 select-none">Digite seu PIN para continuar</p>

      <PinPad pin={pin} setPin={setPin} onComplete={verificar} erro={erro} />

      {tentativas >= 5 && (
        <p className="text-red-400 text-xs mt-8 text-center px-8">
          {tentativas} tentativas incorretas. Certifique-se que está digitando o PIN correto.
        </p>
      )}
    </div>
  )
}
