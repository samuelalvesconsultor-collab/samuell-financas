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
    if (modal === 'novo') await criarConta(dados)
    else await atualizarConta(modal.id, dados)
    setModal(null)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir conta?')) return
    await deletarConta(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  async function pagar(id) {
    await pagarConta(id, new Date().toISOString().split('T')[0])
    carregar()
  }

  const total = lista.reduce((s, c) => s + Number(c.valor), 0)
  const pagas = lista.filter(c => c.status === 'paga').reduce((s, c) => s + Number(c.valor), 0)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4">
        <h1 className="font-display text-sm tracking-widest text-gray-200 uppercase">Contas</h1>
        <MonthPicker />
      </div>

      <div className="card-dark p-4 flex justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Total do mês</p>
          <p className="font-bold text-gray-100 tabular-nums">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Pagas</p>
          <p className="font-bold text-teal-400 tabular-nums">
            {pagas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {lista.map(c => (
          <div key={c.id} className="card-dark p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-100 text-sm">{c.descricao}</p>
                <p className="text-xs text-muted mt-0.5">Vence dia {c.dia_vencimento} · {c.categoria_nome || '—'}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-semibold text-sm text-gray-100 tabular-nums">
                  {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <StatusBadge status={c.status} />
              </div>
            </div>
            <div className="flex gap-3 mt-2.5">
              {c.status !== 'paga' && (
                <button onClick={() => pagar(c.id)}
                  className="text-xs text-teal-400 border border-teal-700/50 rounded px-2 py-0.5 hover:bg-teal-900/30 transition-colors">
                  Pagar
                </button>
              )}
              <button onClick={() => setModal(c)} className="text-xs text-gray-400 hover:text-gray-100">Editar</button>
              <button onClick={() => excluir(c.id)} className="text-xs text-red-500 hover:text-red-400">Excluir</button>
            </div>
          </div>
        ))}
        {!lista.length && <p className="text-center text-muted text-sm py-10">Nenhuma conta no período.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 md:bottom-6 right-4 w-12 h-12 bg-accent hover:bg-red-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center transition-colors">
        +
      </button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA CONTA' : 'EDITAR CONTA'} onClose={() => setModal(null)}>
          <FormConta inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
