import { useState } from 'react'
import { useApp } from '../context/AppContext'

const hoje = new Date().toISOString().split('T')[0]

const VAZIO = { descricao: '', valor: '', data: hoje, categoria_id: '' }

export default function FormEntrada({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial || VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({
      ...form,
      valor: parseFloat(form.valor),
      tipo: 'entrada',
      status: 'pago',
      categoria_id: form.categoria_id || null,
    })
  }

  const cats = categorias.filter(c => !c.arquivada && (c.tipo === 'entrada' || c.tipo === 'ambos'))

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5 block">Nome</label>
        <input required placeholder="Ex: Comissão de venda" value={form.descricao}
          onChange={e => set('descricao', e.target.value)} className="input-dark" />
      </div>

      <div>
        <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5 block">Valor</label>
        <input required type="number" step="0.01" min="0.01" placeholder="0,00" value={form.valor}
          onChange={e => set('valor', e.target.value)} className="input-dark" />
      </div>

      <div>
        <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5 block">Data de Entrada</label>
        <input required type="date" value={form.data}
          onChange={e => set('data', e.target.value)} className="input-dark" />
      </div>

      <div>
        <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5 block">Categoria</label>
        <select required value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} className="select-dark">
          <option value="">Selecionar categoria</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary">Salvar</button>
      </div>
    </form>
  )
}
