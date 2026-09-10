import { useState } from 'react'
import { useApp } from '../context/AppContext'

const VAZIO = {
  descricao: '', valor: '', data: new Date().toISOString().split('T')[0],
  tipo: 'saida', status: 'pendente', categoria_id: '', recorrente: false, recorrencia_dia: '',
}

export default function FormLancamento({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial || VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({
      ...form,
      valor: parseFloat(form.valor),
      categoria_id: form.categoria_id || null,
      recorrencia_dia: form.recorrente ? parseInt(form.recorrencia_dia) : null,
    })
  }

  const catsFiltradas = categorias.filter(c => !c.arquivada && (c.tipo === form.tipo || c.tipo === 'ambos'))

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao}
        onChange={e => set('descricao', e.target.value)} className="input-dark" />

      <div className="grid grid-cols-2 gap-2">
        <input required type="number" step="0.01" placeholder="Valor" value={form.valor}
          onChange={e => set('valor', e.target.value)} className="input-dark" />
        <input required type="date" value={form.data}
          onChange={e => set('data', e.target.value)} className="input-dark" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="select-dark">
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} className="select-dark">
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} className="select-dark">
        <option value="">Sem categoria</option>
        {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
        <input type="checkbox" checked={form.recorrente} onChange={e => set('recorrente', e.target.checked)}
          className="accent-accent" />
        Lançamento recorrente
      </label>

      {form.recorrente && (
        <input type="number" min="1" max="31" placeholder="Dia do mês" value={form.recorrencia_dia}
          onChange={e => set('recorrencia_dia', e.target.value)} className="input-dark" />
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary">Salvar</button>
      </div>
    </form>
  )
}
