import { useState } from 'react'

const CORES = ['#6366f1', '#ec4899', '#f97316', '#14b8a6', '#22c55e', '#eab308', '#8b5cf6', '#06b6d4']

export default function FormCartao({ inicial, onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    nome: inicial?.nome || '',
    conta_pagamento: inicial?.conta_pagamento || '',
    cor: inicial?.cor || '#6366f1',
  })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setLoading(true)
    try {
      await onSalvar({ ...form, nome: form.nome.trim() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Nome do Cartão</label>
        <input
          className="input-dark w-full"
          value={form.nome}
          onChange={set('nome')}
          placeholder="Ex: Nubank, Itaú Platinum..."
          required
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Conta para Pagamento</label>
        <input
          className="input-dark w-full"
          value={form.conta_pagamento}
          onChange={set('conta_pagamento')}
          placeholder="Ex: Conta Corrente Bradesco"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {CORES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, cor: c }))}
              className="w-7 h-7 rounded-full transition-transform active:scale-90"
              style={{
                background: c,
                border: form.cor === c ? '2px solid #fff' : '2px solid transparent',
                boxShadow: form.cor === c ? `0 0 8px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancelar} className="btn-ghost flex-1">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
