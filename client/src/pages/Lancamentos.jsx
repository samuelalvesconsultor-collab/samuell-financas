import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getLancamentos, criarLancamento, atualizarLancamento, deletarLancamento } from '../api/lancamentos'
import Modal from '../components/Modal'
import FormLancamento from '../components/FormLancamento'
import StatusBadge from '../components/StatusBadge'
import MonthPicker from '../components/MonthPicker'

export default function Lancamentos() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const carregar = () => {
    const params = { mes: mesSelecionado }
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    getLancamentos(params).then(setLista)
  }

  useEffect(() => { carregar() }, [mesSelecionado, filtroTipo, filtroStatus])

  async function salvar(dados) {
    if (modal === 'novo') await criarLancamento(dados)
    else await atualizarLancamento(modal.id, dados)
    setModal(null)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir lançamento?')) return
    await deletarLancamento(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  function exportarCSV() {
    const linhas = [
      ['Data', 'Descrição', 'Tipo', 'Categoria', 'Status', 'Valor'],
      ...lista.map(l => [
        new Date(l.data).toLocaleDateString('pt-BR'),
        l.descricao, l.tipo, l.categoria_nome || '', l.status,
        Number(l.valor).toFixed(2).replace('.', ','),
      ]),
    ]
    const csv = linhas.map(r => r.map(v => `"${v}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `lancamentos-${mesSelecionado}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const total = lista.reduce((s, l) => s + (l.tipo === 'entrada' ? +l.valor : -l.valor), 0)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4">
        <h1 className="font-display text-sm tracking-widest text-gray-200 uppercase">Lançamentos</h1>
        <MonthPicker />
      </div>

      <div className="flex gap-2">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="select-dark flex-1">
          <option value="">Todos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="select-dark flex-1">
          <option value="">Qualquer status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted">
          Saldo:{' '}
          <span className={`font-semibold tabular-nums ${total >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </p>
        <button onClick={exportarCSV} className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1 hover:bg-accent/10 transition-colors">
          Exportar CSV
        </button>
      </div>

      <div className="space-y-2">
        {lista.map(l => (
          <div key={l.id} className="card-dark p-3 flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-100 text-sm">{l.descricao}</p>
              <p className="text-xs text-muted mt-0.5">{new Date(l.data).toLocaleDateString('pt-BR')} · {l.categoria_nome || '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`font-semibold text-sm tabular-nums ${l.tipo === 'entrada' ? 'text-teal-400' : 'text-red-400'}`}>
                {l.tipo === 'entrada' ? '+' : '-'}{Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <StatusBadge status={l.status} />
              <div className="flex gap-3 mt-0.5">
                <button onClick={() => setModal(l)} className="text-xs text-gray-400 hover:text-gray-100">Editar</button>
                <button onClick={() => excluir(l.id)} className="text-xs text-red-500 hover:text-red-400">Excluir</button>
              </div>
            </div>
          </div>
        ))}
        {!lista.length && <p className="text-center text-muted text-sm py-10">Nenhum lançamento no período.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 md:bottom-6 right-4 w-12 h-12 bg-accent hover:bg-red-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center transition-colors">
        +
      </button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVO LANÇAMENTO' : 'EDITAR LANÇAMENTO'} onClose={() => setModal(null)}>
          <FormLancamento inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
