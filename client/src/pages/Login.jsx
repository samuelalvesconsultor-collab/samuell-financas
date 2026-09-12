import { useState } from 'react'
import { login, register } from '../api/auth'

export default function Login({ onLogin }) {
  const [modo, setModo]       = useState('login') // 'login' | 'register'
  const [email, setEmail]     = useState(() => localStorage.getItem('samuell_email') || '')
  const [senha, setSenha]     = useState('')
  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const data = modo === 'login'
        ? await login(email, senha)
        : await register(email, senha)
      localStorage.setItem('samuell_email', data.email)
      onLogin(data.email)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>

      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Samuell Finanças</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>CRM Samuell Seguros</p>
        </div>

        {/* Card de login */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-5"
            style={{ color: 'var(--text-faint)' }}>
            {modo === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </p>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-dark"
              autoComplete="email"
            />
            <input
              type="password"
              required
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="input-dark"
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />

            {erro && (
              <div className="rounded-lg px-3 py-2 text-xs text-red-400"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            onClick={() => { setModo(m => m === 'login' ? 'register' : 'login'); setErro('') }}
            className="w-full text-center text-xs mt-4 transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            {modo === 'login' ? 'Primeira vez? Criar conta' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
