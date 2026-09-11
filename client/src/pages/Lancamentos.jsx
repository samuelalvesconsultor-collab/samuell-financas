import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getLancamentos, criarLancamento, atualizarLancamento, deletarLancamento } from '../api/lancamentos'
import Modal from '../components/Modal'
import FormEntrada from '../components/FormEntrada'
import CategoryBadge from '../components/CategoryBadge'
import MonthPicker from '../components/MonthPicker'
import PageHeader from '../components/PageHeader'

const BRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = s => {
  const d = new Date(s)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString('pt-BR')
}

export default function Entradas() {
  const { mesSelecionado } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)

  const carregar = () => getLancamentos({ mes: mesSelecionado, tipo: 'entrada' }).then(setLista)
  useEffect(() => { carregar() }, [mesSelecionado])

  async function salvar(dados) {
    if (modal === 'novo') await criarLancamento(dados)
    else await atualizarLancamento(modal.id, dados)
    setModal(null)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir entrada?')) return
    await deletarLancamento(id)
    setLista(l => l.filter(x => x.id !== id))
  }

  function exportarCSV() {
    const rows = [
      ['Data', 'Nome', 'Categoria', 'Valor'],
      ...lista.map(l => [fmtDate(l.data), l.descricao, l.categoria_nome || '', Number(l.valor).toFixed(2).replace('.', ',')]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `entradas-${mesSelecionado}.csv`
    a.click()
  }

  const total = lista.reduce((s, l) => s + Number(l.valor), 0)

  return (
    <div className="min-h-screen" style={{ background: '#121212' }}>
      <PageHeader titulo="Entradas">
        <MonthPicker />
        <button onClick={exportarCSV} className="btn-outline hidden sm:flex">Exportar CSV</button>
        <button onClick={() => setModal('novo')} className="btn-action text-xs md:text-sm px-3 md:px-4">
          <span className="text-base md:text-lg leading-none">+</span>
          <span className="hidden sm:inline">Nova</span>
        </button>
      </PageHeader>

      {/* Resumo do mês */}
      {lista.length > 0 && (
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="rounded-xl px-4 md:px-5 py-4 flex items-center justify-between"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Total do Mês</p>
              <div className="h-0.5 w-5 rounded-full mb-2" style={{ background: '#0d9488' }} />
              <p className="font-display text-lg md:text-xl font-bold text-teal-400 tabular-nums">{BRL(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Registros</p>
              <p className="text-xl md:text-2xl font-bold text-white">{lista.length}</p>
            </div>
          </div>
        </div>
      )}

      {!lista.length ? (
        <div className="text-center py-16 text-gray-600 text-sm px-4">
          <p className="mb-2">Nenhuma entrada registrada neste mês.</p>
          <button onClick={() => setModal('novo')} className="text-teal-500 hover:text-teal-400 underline underline-offset-2">
            Registrar agora
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-x-auto px-6">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Data</th>
                  <th className="th">Nome</th>
                  <th className="th">Categoria</th>
                  <th className="th text-right">Valor</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {lista.map(l => (
                  <tr key={l.id} className="table-row">
                    <td className="td text-gray-500 tabular-nums whitespace-nowrap">{fmtDate(l.data)}</td>
                    <td className="td text-white font-medium">{l.descricao}</td>
                    <td className="td"><CategoryBadge nome={l.categoria_nome} /></td>
                    <td className="td text-right font-bold tabular-nums text-teal-400">+{BRL(l.valor)}</td>
                    <td className="td text-right whitespace-nowrap">
                      <button onClick={() => setModal(l)} className="text-gray-600 hover:text-gray-300 mr-4 text-xs transition-colors">Editar</button>
                      <button onClick={() => excluir(l.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-2 px-4 pb-4">
            {lista.map(l => (
              <div key={l.id} className="rounded-xl p-4"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{l.descricao}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-600">{fmtDate(l.data)}</span>
                      <CategoryBadge nome={l.categoria_nome} />
                    </div>
                  </div>
                  <p className="text-teal-400 font-bold tabular-nums text-base shrink-0">+{BRL(l.valor)}</p>
                </div>
                <div className="flex gap-4 mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <button onClick={() => setModal(l)} className="text-gray-600 hover:text-gray-300 text-xs transition-colors">Editar</button>
                  <button onClick={() => excluir(l.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA ENTRADA' : 'EDITAR ENTRADA'} onClose={() => setModal(null)}>
          <FormEntrada inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
