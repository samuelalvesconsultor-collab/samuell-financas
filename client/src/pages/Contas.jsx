import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getContas, criarConta, atualizarConta, deletarConta, pagarConta } from '../api/contas'
import Modal from '../components/Modal'
import FormConta from '../components/FormConta'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Contas() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [confirmPagar, setConfirmPagar] = useState(null)

  const carregar = () => getContas(mesSelecionado).then(setLista)
  useEffect(() => { carregar() }, [mesSelecionado])

  async function salvar(dados) {
    if (modal === 'novo') await criarConta(dados)
    else await atualizarConta(modal.id, dados)
    setModal(null); carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir conta?')) return
    await deletarConta(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  async function confirmarPagar() {
    if (!confirmPagar) return
    await pagarConta(confirmPagar.id, new Date().toISOString().split('T')[0])
    setConfirmPagar(null)
    carregar()
  }

  const total = lista.reduce((s, c) => s + Number(c.valor), 0)
  const pagas = lista.filter(c => c.status === 'paga').reduce((s, c) => s + Number(c.valor), 0)
  const pendente = total - pagas

  return (
    <div className="min-h-screen" style={{ background: '#121212' }}>
      <PageHeader titulo="Contas">
        <MonthPicker />
        <button onClick={() => setModal('novo')} className="btn-action">
          <span className="text-lg leading-none">+</span> Nova
        </button>
      </PageHeader>

      {/* Resumo */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Total', valor: total,    cor: '#9ca3af' },
          { label: 'Pagas', valor: pagas,    cor: '#14b8a6' },
          { label: 'Pendente', valor: pendente, cor: pendente > 0 ? '#f87171' : '#9ca3af' },
        ].map(({ label, valor, cor }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>{label}</p>
            <div className="h-0.5 w-5 mb-2 rounded-full" style={{ background: cor }} />
            <p className="font-display text-base font-bold tabular-nums" style={{ color: cor }}>{BRL(valor)}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto px-6">
        {!lista.length ? (
          <div className="text-center py-16 text-gray-600 text-sm">Nenhuma conta no período.</div>
        ) : (
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr>
                <th className="th">Descrição</th>
                <th className="th">Vencimento</th>
                <th className="th">Categoria</th>
                <th className="th">Status</th>
                <th className="th text-right">Valor</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="td text-white font-medium">{c.descricao}</td>
                  <td className="td text-gray-500">Dia {c.dia_vencimento}</td>
                  <td className="td"><CategoryBadge nome={c.categoria_nome} /></td>
                  <td className="td"><StatusBadge status={c.status} /></td>
                  <td className="td text-right text-white font-semibold tabular-nums">{BRL(c.valor)}</td>
                  <td className="td text-right whitespace-nowrap">
                    {c.status !== 'paga' && (
                      <button onClick={() => setConfirmPagar(c)} className="text-teal-500 hover:text-teal-400 text-xs mr-4 transition-colors">Pagar</button>
                    )}
                    <button onClick={() => setModal(c)} className="text-gray-600 hover:text-gray-300 text-xs mr-4 transition-colors">Editar</button>
                    <button onClick={() => excluir(c.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirmação de pagamento */}
      {confirmPagar && (
        <Modal titulo="CONFIRMAR PAGAMENTO" onClose={() => setConfirmPagar(null)}>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Confirma o pagamento da conta abaixo?</p>
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white font-medium">{confirmPagar.descricao}</p>
              <p className="text-teal-400 font-display font-bold text-xl mt-1 tabular-nums">{BRL(confirmPagar.valor)}</p>
              <p className="text-gray-600 text-xs mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmPagar(null)} className="btn-ghost">Cancelar</button>
              <button onClick={confirmarPagar} className="btn-primary">Confirmar Pagamento</button>
            </div>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA CONTA' : 'EDITAR CONTA'} onClose={() => setModal(null)}>
          <FormConta inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
