import { useEffect, useState } from 'react'
import { getDividas, criarDivida, atualizarDivida, deletarDivida, registrarParcela } from '../api/dividas'
import Modal from '../components/Modal'
import FormDivida from '../components/FormDivida'

const TIPO_LABEL = { cartao: 'Cartão', financiamento: 'Financiamento', emprestimo: 'Empréstimo', parcelamento: 'Parcelamento' }

export default function Dividas() {
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [filtroAtiva, setFiltroAtiva] = useState('true')

  const carregar = async () => {
    if (filtroAtiva === '') {
      // Busca ativas e inativas separadamente e combina
      const [ativas, inativas] = await Promise.all([getDividas(true), getDividas(false)])
      setLista([...ativas, ...inativas])
    } else {
      const data = await getDividas(filtroAtiva === 'true')
      setLista(data)
    }
  }

  useEffect(() => { carregar() }, [filtroAtiva])

  async function salvar(dados) {
    if (modal === 'novo') {
      await criarDivida(dados)
    } else {
      await atualizarDivida(modal.id, dados)
    }
    setModal(null)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir dívida?')) return
    await deletarDivida(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  async function pagar(id) {
    await registrarParcela(id)
    carregar()
  }

  const totalMensal = lista.filter(d => d.ativa).reduce((s, d) => s + Number(d.valor_parcela), 0)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Dívidas</h1>
        <select value={filtroAtiva} onChange={e => setFiltroAtiva(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm">
          <option value="true">Ativas</option>
          <option value="false">Quitadas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {filtroAtiva === 'true' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
          <span className="text-blue-700">Comprometimento mensal: </span>
          <span className="font-bold text-blue-900">
            {totalMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {lista.map(d => {
          const progresso = d.num_parcelas > 0 ? (d.parcelas_pagas / d.num_parcelas) * 100 : 0
          const restantes = d.parcelas_restantes ?? (d.num_parcelas - d.parcelas_pagas)
          return (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{d.descricao}</p>
                  <p className="text-xs text-gray-400">{TIPO_LABEL[d.tipo] || d.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Parcela</p>
                  <p className="font-semibold text-sm text-gray-800">
                    {Number(d.valor_parcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{d.parcelas_pagas} de {d.num_parcelas} parcelas</span>
                  <span>{restantes} restantes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                </div>
              </div>

              <div className="flex gap-3">
                {d.ativa && (
                  <button onClick={() => pagar(d.id)}
                    className="text-xs text-green-700 border border-green-300 rounded px-2 py-0.5">
                    +1 Parcela
                  </button>
                )}
                <button onClick={() => setModal(d)} className="text-xs text-blue-600">Editar</button>
                <button onClick={() => excluir(d.id)} className="text-xs text-red-500">Excluir</button>
              </div>
            </div>
          )
        })}
        {!lista.length && <p className="text-center text-gray-400 text-sm py-8">Nenhuma dívida encontrada.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Nova Dívida' : 'Editar Dívida'} onClose={() => setModal(null)}>
          <FormDivida inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
