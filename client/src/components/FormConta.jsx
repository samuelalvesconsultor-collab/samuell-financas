import { useState } from 'react'
import { useApp } from '../context/AppContext'

const VAZIO = {
  descricao: '',
  valor: '',
  dia_vencimento: '',
  mes_referencia: new Date().toISOString().slice(0, 7) + '-01',
  status: 'pendente',
  categoria_id: '',
  fixa: true,
}

export default function FormConta({ inicial, onSalvar, onCancelar }) {
  const { categorias } = useApp()
  const [form, setForm] = useState(inicial || VAZIO)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar({
      ...form,
      valor: parseFloat(form.valor),
      dia_vencimento: parseInt(form.dia_vencimento),
      categoria_id: form.categoria_id || null,
    })
  }

  const cats = categorias.filter(c => !c.arquivada)

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Descrição" value={form.descricao}
        onChange={e => set('descricao', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <input required type="number" step="0.01" placeholder="Valor" value={form.valor}
          onChange={e => set('valor', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" min="1" max="31" placeholder="Dia vencimento" value={form.dia_vencimento}
          onChange={e => set('dia_vencimento', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      <select value={form.status} onChange={e => set('status', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="pendente">Pendente</option>
        <option value="paga">Paga</option>
        <option value="atrasada">Atrasada</option>
      </select>

      <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Sem categoria</option>
        {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.fixa} onChange={e => set('fixa', e.target.checked)} />
        Conta fixa (recorrente todo mês)
      </label>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar}
          className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
        <button type="submit"
          className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
      </div>
    </form>
  )
}
