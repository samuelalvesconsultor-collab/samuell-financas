import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const toDateStr = v => (!v ? '' : String(v).slice(0, 10))

const VAZIO = {
  descricao: '', tipo: 'parcelamento', forma_pagamento: 'boleto', valor_parcela: '', num_parcelas: '',
  valor_total: '', parcelas_pagas: 0,
  data_inicio: new Date().toISOString().split('T')[0], data_termino: '', categoria_id: '',
}

export default function FormDivida({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial ? {
    ...inicial,
    data_inicio: toDateStr(inicial.data_inicio),
    data_termino: toDateStr(inicial.data_termino),
    categoria_id: inicial.categoria_id || '',
  } : VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Calcula valor_total = valor_parcela × num_parcelas
  useEffect(() => {
    const vp = parseFloat(form.valor_parcela)
    const np = parseInt(form.num_parcelas)
    if (vp > 0 && np > 0) {
      setForm(f => ({ ...f, valor_total: (vp * np).toFixed(2) }))
    } else {
      setForm(f => ({ ...f, valor_total: '' }))
    }
  }, [form.valor_parcela, form.num_parcelas])

  // Calcula data_termino = data_inicio + (num_parcelas - 1) meses
  useEffect(() => {
    if (form.data_inicio && parseInt(form.num_parcelas) > 0) {
      const d = new Date(form.data_inicio + 'T12:00:00Z')
      d.setUTCMonth(d.getUTCMonth() + parseInt(form.num_parcelas) - 1)
      setForm(f => ({ ...f, data_termino: d.toISOString().split('T')[0] }))
    } else {
      setForm(f => ({ ...f, data_termino: '' }))
    }
  }, [form.data_inicio, form.num_parcelas])

  function submit(e) {
    e.preventDefault()
    const vp = parseFloat(form.valor_parcela)
    const np = parseInt(form.num_parcelas)
    onSalvar({
      ...form,
      valor_parcela: vp,
      num_parcelas: np,
      valor_total: parseFloat(form.valor_total) || vp * np,
      parcelas_pagas: parseInt(form.parcelas_pagas) || 0,
      categoria_id: form.categoria_id || null,
    })
  }

  const cats = categorias.filter(c => !c.arquivada && (c.tipo === 'saida' || c.tipo === 'ambos'))

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao}
        onChange={e => set('descricao', e.target.value)} className="input-dark" />

      <div className="grid grid-cols-2 gap-2">
        <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="select-dark">
          <option value="parcelamento">Parcelamento</option>
          <option value="financiamento">Financiamento</option>
          <option value="emprestimo">Empréstimo</option>
          <option value="cartao">Cartão</option>
        </select>
        <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)} className="select-dark">
          <option value="boleto">Boleto</option>
          <option value="cartao_credito">Cartão de Crédito</option>
        </select>
      </div>

      {/* Parcela (input) + Nº Parcelas (input) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Valor da Parcela</label>
          <input required type="number" step="0.01" min="0.01" placeholder="0,00" value={form.valor_parcela}
            onChange={e => set('valor_parcela', e.target.value)} className="input-dark" />
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Nº Parcelas</label>
          <input required type="number" min="1" placeholder="12" value={form.num_parcelas}
            onChange={e => set('num_parcelas', e.target.value)} className="input-dark" />
        </div>
      </div>

      {/* Valor Total calculado */}
      <div>
        <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Valor Total (calculado)</label>
        <input readOnly type="text"
          value={form.valor_total
            ? `R$ ${parseFloat(form.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : '—'}
          className="input-dark opacity-60 cursor-default" />
      </div>

      {/* 1ª Parcela (input) + Término (calculado) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">1ª Parcela</label>
          <input required type="date" value={form.data_inicio}
            onChange={e => set('data_inicio', e.target.value)} className="input-dark" />
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 block">Término (calculado)</label>
          <input readOnly type="date" value={form.data_termino}
            className="input-dark opacity-60 cursor-default" />
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
