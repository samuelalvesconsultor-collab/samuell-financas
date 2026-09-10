import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getContas, criarConta, atualizarConta, deletarConta, pagarConta } from '../api/contas'
import Modal from '../components/Modal'
import FormConta from '../components/FormConta'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'

export default function Contas() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)

  const carregar = () => getContas(mesSelecionado).then(setLista)

  useEffect(() => { carregar() }, [mesSelecionado])

  async function salvar(dados) {
    if (modal === 'novo') {
      await criarConta(dados)
    } else {
      await atualizarConta(modal.id, dados)
    }
    setModal(null)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir conta?')) return
    await deletarConta(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  async function pagar(id) {
    const data_pagamento = new Date().toISOString().split('T')[0]
    await pagarConta(id, data_pagamento)
    carregar()
  }

  const total = lista.reduce((s, c) => s + Number(c.valor), 0)
  const pagas = lista.filter(c => c.status === 'paga').reduce((s, c) => s + Number(c.valor), 0)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Contas</h1>
        <MonthPicker />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between">
        <div>
          <p className="text-xs text-gray-500">Total do mês</p>
          <p className="font-bold text-gray-800">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Pagas</p>
          <p className="font-bold text-green-700">
            {pagas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {lista.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800 text-sm">{c.descricao}</p>
                <p className="text-xs text-gray-400">Vence dia {c.dia_vencimento} · {c.categoria_nome || '—'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-sm text-gray-800">
                  {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <StatusBadge status={c.status} />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              {c.status !== 'paga' && (
                <button onClick={() => pagar(c.id)}
                  className="text-xs text-green-700 border border-green-300 rounded px-2 py-0.5">
                  Pagar
                </button>
              )}
              <button onClick={() => setModal(c)} className="text-xs text-blue-600">Editar</button>
              <button onClick={() => excluir(c.id)} className="text-xs text-red-500">Excluir</button>
            </div>
          </div>
        ))}
        {!lista.length && <p className="text-center text-gray-400 text-sm py-8">Nenhuma conta no período.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Nova Conta' : 'Editar Conta'} onClose={() => setModal(null)}>
          <FormConta inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
