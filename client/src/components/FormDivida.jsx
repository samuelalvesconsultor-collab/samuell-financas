import { useState } from 'react'
import { useApp } from '../context/AppContext'

const VAZIO = {
  descricao: '', tipo: 'parcelamento', valor_total: '', num_parcelas: '',
  valor_parcela: '', parcelas_pagas: 0,
  data_inicio: new Date().toISOString().split('T')[0], data_termino: '', categoria_id: '',
}

export default function FormDivida({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial || VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({
      ...form,
      valor_total: parseFloat(form.valor_total),
      num_parcelas: parseInt(form.num_parcelas),
      valor_parcela: parseFloat(form.valor_parcela),
      parcelas_pagas: parseInt(form.parcelas_pagas) || 0,
      categoria_id: form.categoria_id || null,
    })
  }

  const cats = categorias.filter(c => !c.arquivada)

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao}
        onChange={e => set('descricao', e.target.value)} className="input-dark" />

      <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="select-dark">
        <option value="parcelamento">Parcelamento</option>
        <option value="financiamento">Financiamento</option>
        <option value="emprestimo">Empréstimo</option>
        <option value="cartao">Cartão</option>
      </select>

      <div className="grid grid-cols-2 gap-2">
        <input required type="number" step="0.01" placeholder="Valor total" value={form.valor_total}
          onChange={e => set('valor_total', e.target.value)} className="input-dark" />
        <input required type="number" step="0.01" placeholder="Valor parcela" value={form.valor_parcela}
          onChange={e => set('valor_parcela', e.target.value)} className="input-dark" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input required type="number" placeholder="Nº parcelas" value={form.num_parcelas}
          onChange={e => set('num_parcelas', e.target.value)} className="input-dark" />
        <input type="number" placeholder="Pagas" value={form.parcelas_pagas}
          onChange={e => set('parcelas_pagas', e.target.value)} className="input-dark" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input required type="date" value={form.data_inicio}
          onChange={e => set('data_inicio', e.target.value)} className="input-dark" />
        <input required type="date" value={form.data_termino}
          onChange={e => set('data_termino', e.target.value)} className="input-dark" />
      </div>

      <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} className="select-dark">
        <option value="">Sem categoria</option>
        {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary">Salvar</button>
      </div>
    </form>
  )
}
