import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getLancamentos, criarLancamento, atualizarLancamento, deletarLancamento } from '../api/lancamentos'
import Modal from '../components/Modal'
import FormLancamento from '../components/FormLancamento'
import StatusBadge from '../components/StatusBadge'
import CategoryBadge from '../components/CategoryBadge'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = s => {
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

export default function Lancamentos() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const carregar = () => {
    const p = { mes: mesSelecionado }
    if (filtroTipo) p.tipo = filtroTipo
    if (filtroStatus) p.status = filtroStatus
    getLancamentos(p).then(setLista)
  }
  useEffect(() => { carregar() }, [mesSelecionado, filtroTipo, filtroStatus])

  async function salvar(dados) {
    if (modal === 'novo') await criarLancamento(dados)
    else await atualizarLancamento(modal.id, dados)
    setModal(null); carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir lançamento?')) return
    await deletarLancamento(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  function exportarCSV() {
    const rows = [['Data','Descrição','Tipo','Categoria','Status','Valor'],
      ...lista.map(l => [fmtDate(l.data), l.descricao, l.tipo, l.categoria_nome||'', l.status, Number(l.valor).toFixed(2).replace('.',',')])]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `lancamentos-${mesSelecionado}.csv`; a.click()
  }

  const total = lista.reduce((s, l) => s + (l.tipo === 'entrada' ? +l.valor : -l.valor), 0)

  return (
    <div className="min-h-screen" style={{ background: '#121212' }}>
      <PageHeader titulo="Lançamentos">
        <MonthPicker />
        <button onClick={exportarCSV} className="btn-outline">Exportar CSV</button>
        <button onClick={() => setModal('novo')} className="btn-action">
          <span className="text-lg leading-none">+</span> Novo
        </button>
      </PageHeader>

      {/* Filtros */}
      <div className="px-6 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="select-dark !w-auto">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="select-dark !w-auto">
          <option value="">Qualquer status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
        <span className="text-xs text-gray-600 ml-auto">
          Saldo:{' '}
          <span className={`font-semibold tabular-nums ${total >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
            {BRL(total)}
          </span>
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        {!lista.length ? (
          <div className="text-center py-16 text-gray-600 text-sm">Nenhum lançamento no período.</div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr>
                <th className="th">Data</th>
                <th className="th">Descrição</th>
                <th className="th">Categoria</th>
                <th className="th">Status</th>
                <th className="th text-right">Valor</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {lista.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="td text-gray-500 tabular-nums">{fmtDate(l.data)}</td>
                  <td className="td text-white font-medium">{l.descricao}</td>
                  <td className="td"><CategoryBadge nome={l.categoria_nome} /></td>
                  <td className="td"><StatusBadge status={l.status} /></td>
                  <td className={`td text-right font-semibold tabular-nums ${l.tipo === 'entrada' ? 'text-teal-400' : 'text-red-400'}`}>
                    {l.tipo === 'entrada' ? '+' : '-'}{BRL(l.valor)}
                  </td>
                  <td className="td text-right whitespace-nowrap">
                    <button onClick={() => setModal(l)} className="text-gray-600 hover:text-gray-300 mr-4 text-xs transition-colors">Editar</button>
                    <button onClick={() => excluir(l.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVO LANÇAMENTO' : 'EDITAR LANÇAMENTO'} onClose={() => setModal(null)}>
          <FormLancamento inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
