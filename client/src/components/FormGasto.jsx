import { useState, useEffect } from 'react'
import { getCartoes } from '../api/cartoes'

const hoje = () => new Date().toISOString().split('T')[0]

const FORMAS = [
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
]

const CATEGORIAS = [
  { value: 'comida', label: 'Comida' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'farmacia', label: 'Farmácia' },
  { value: 'compras_necessarias', label: 'Compras necessárias' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'gastos_extras', label: 'Gastos extras' },
]

export default function FormGasto({ onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    data: hoje(),
    forma_pagamento: 'pix',
    categoria: 'comida',
    cartao_id: '',
  })
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCartoes().then(setCartoes).catch(() => {})
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleForma(e) {
    const val = e.target.value
    setForm(f => ({ ...f, forma_pagamento: val, cartao_id: val !== 'credito' ? '' : f.cartao_id }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.descricao.trim() || !form.valor) return
    setLoading(true)
    try {
      await onSalvar({
        ...form,
        valor: parseFloat(form.valor),
        cartao_id: form.cartao_id ? Number(form.cartao_id) : null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Nome</label>
        <input
          className="input-dark w-full"
          value={form.descricao}
          onChange={set('descricao')}
          placeholder="Descrição do gasto"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Valor</label>
          <input
            className="input-dark w-full"
            type="number"
            step="0.01"
            min="0.01"
            value={form.valor}
            onChange={set('valor')}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Data</label>
          <input
            className="input-dark w-full"
            type="date"
            value={form.data}
            onChange={set('data')}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Forma de Pagamento</label>
        <select className="select-dark w-full" value={form.forma_pagamento} onChange={handleForma}>
          {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {form.forma_pagamento === 'credito' && cartoes.length > 0 && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Cartão</label>
          <select className="select-dark w-full" value={form.cartao_id} onChange={set('cartao_id')}>
            <option value="">Sem cartão vinculado</option>
            {cartoes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
        <select className="select-dark w-full" value={form.categoria} onChange={set('categoria')}>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
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
