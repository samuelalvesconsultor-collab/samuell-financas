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
      const [ativas, inativas] = await Promise.all([getDividas(true), getDividas(false)])
      setLista([...ativas, ...inativas])
    } else {
      setLista(await getDividas(filtroAtiva === 'true'))
    }
  }

  useEffect(() => { carregar() }, [filtroAtiva])

  async function salvar(dados) {
    if (modal === 'novo') await criarDivida(dados)
    else await atualizarDivida(modal.id, dados)
    setModal(null)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir dívida?')) return
    await deletarDivida(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  const totalMensal = lista.filter(d => d.ativa).reduce((s, d) => s + Number(d.valor_parcela), 0)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4">
        <h1 className="font-display text-sm tracking-widest text-gray-200 uppercase">Dívidas</h1>
        <select value={filtroAtiva} onChange={e => setFiltroAtiva(e.target.value)} className="select-dark !w-auto">
          <option value="true">Ativas</option>
          <option value="false">Quitadas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {filtroAtiva === 'true' && totalMensal > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex justify-between items-center">
          <span className="text-xs text-muted uppercase tracking-widest">Comprometimento mensal</span>
          <span className="font-bold text-red-400 tabular-nums">
            {totalMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {lista.map(d => {
          const progresso = d.num_parcelas > 0 ? (d.parcelas_pagas / d.num_parcelas) * 100 : 0
          const restantes = d.parcelas_restantes ?? (d.num_parcelas - d.parcelas_pagas)
          return (
            <div key={d.id} className="card-dark p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-100 text-sm">{d.descricao}</p>
                  <p className="text-xs text-muted mt-0.5">{TIPO_LABEL[d.tipo] || d.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted mb-0.5">Parcela</p>
                  <p className="font-semibold text-sm text-gray-100 tabular-nums">
                    {Number(d.valor_parcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>{d.parcelas_pagas} de {d.num_parcelas} parcelas</span>
                  <span>{restantes} restantes</span>
                </div>
                <div className="w-full bg-rim rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                </div>
              </div>

              <div className="flex gap-3">
                {d.ativa && (
                  <button onClick={() => registrarParcela(d.id).then(carregar)}
                    className="text-xs text-teal-400 border border-teal-700/50 rounded px-2 py-0.5 hover:bg-teal-900/30 transition-colors">
                    +1 Parcela
                  </button>
                )}
                <button onClick={() => setModal(d)} className="text-xs text-gray-400 hover:text-gray-100">Editar</button>
                <button onClick={() => excluir(d.id)} className="text-xs text-red-500 hover:text-red-400">Excluir</button>
              </div>
            </div>
          )
        })}
        {!lista.length && <p className="text-center text-muted text-sm py-10">Nenhuma dívida encontrada.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 md:bottom-6 right-4 w-12 h-12 bg-accent hover:bg-red-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center transition-colors">
        +
      </button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA DÍVIDA' : 'EDITAR DÍVIDA'} onClose={() => setModal(null)}>
          <FormDivida inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
