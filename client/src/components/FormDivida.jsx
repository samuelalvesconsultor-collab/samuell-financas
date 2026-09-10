import { useState, useEffect } from 'react'
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

  // Calcula valor_parcela em tempo real quando valor_total ou num_parcelas mudam
  useEffect(() => {
    if (!inicial && form.valor_total && form.num_parcelas > 0) {
      const vp = (parseFloat(form.valor_total) / parseInt(form.num_parcelas)).toFixed(2)
      setForm(f => ({ ...f, valor_parcela: vp }))
    }
  }, [form.valor_total, form.num_parcelas])

  // Calcula data_termino em tempo real quando data_inicio ou num_parcelas mudam
  useEffect(() => {
    if (!inicial && form.data_inicio && form.num_parcelas > 0) {
      const d = new Date(form.data_inicio + 'T12:00:00Z')
      d.setUTCMonth(d.getUTCMonth() + parseInt(form.num_parcelas) - 1)
      setForm(f => ({ ...f, data_termino: d.toISOString().split('T')[0] }))
    }
  }, [form.data_inicio, form.num_parcelas])

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
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Valor Total</label>
          <input required type="number" step="0.01" placeholder="0,00" value={form.valor_total}
            onChange={e => set('valor_total', e.target.value)} className="input-dark" />
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Nº Parcelas</label>
          <input required type="number" min="1" placeholder="12" value={form.num_parcelas}
            onChange={e => set('num_parcelas', e.target.value)} className="input-dark" />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Valor da Parcela (calculado)</label>
        <input required type="number" step="0.01" placeholder="0,00" value={form.valor_parcela}
          onChange={e => set('valor_parcela', e.target.value)} className="input-dark" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">1ª Parcela</label>
          <input required type="date" value={form.data_inicio}
            onChange={e => set('data_inicio', e.target.value)} className="input-dark" />
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Término (calculado)</label>
          <input required type="date" value={form.data_termino}
            onChange={e => set('data_termino', e.target.value)} className="input-dark" />
        </div>
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
