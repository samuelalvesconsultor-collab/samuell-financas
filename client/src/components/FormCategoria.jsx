import { useState } from 'react'

const VAZIO = { nome: '', tipo: 'ambos' }

export default function FormCategoria({ inicial, onSalvar, onCancelar }) {
  const [form, setForm] = useState(inicial || VAZIO)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar(form)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Nome" value={form.nome}
        onChange={e => set('nome', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" />

      <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="ambos">Entrada e Saída</option>
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
      </select>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancelar}
          className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
        <button type="submit"
          className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
      </div>
    </form>
  )
}
