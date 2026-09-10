import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getCategorias, criarCategoria, atualizarCategoria, arquivarCategoria } from '../api/categorias'
import Modal from '../components/Modal'
import FormCategoria from '../components/FormCategoria'
import PageHeader from '../components/PageHeader'

const TIPO_LABEL = { entrada: 'Entrada', saida: 'Saída', ambos: 'Ambos' }

export default function Categorias() {
  const { setCategorias } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)

  const carregar = async () => {
    if (mostrarArquivadas) {
      const [ativas, arq] = await Promise.all([getCategorias(false), getCategorias(true)])
      setLista([...ativas, ...arq]); setCategorias(ativas)
    } else {
      const data = await getCategorias(false)
      setLista(data); setCategorias(data)
    }
  }
  useEffect(() => { carregar() }, [mostrarArquivadas])

  async function salvar(dados) {
    if (modal === 'novo') await criarCategoria(dados)
    else await atualizarCategoria(modal.id, dados)
    setModal(null); carregar()
  }

  const ativas = lista.filter(c => !c.arquivada)
  const arquivadas = lista.filter(c => c.arquivada)

  return (
    <div className="min-h-screen" style={{ background: '#121212' }}>
      <PageHeader titulo="Categorias">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
          <input type="checkbox" checked={mostrarArquivadas} onChange={e => setMostrarArquivadas(e.target.checked)}
            className="accent-red-600" />
          Arquivadas
        </label>
        <button onClick={() => setModal('novo')} className="btn-action">
          <span className="text-lg leading-none">+</span> Nova
        </button>
      </PageHeader>

      <div className="overflow-x-auto px-6 py-2">
        {!lista.length ? (
          <div className="text-center py-16 text-gray-600 text-sm">Nenhuma categoria.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Nome</th>
                <th className="th">Tipo</th>
                <th className="th">Padrão</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {ativas.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="td text-white font-medium">{c.nome}</td>
                  <td className="td text-gray-500">{TIPO_LABEL[c.tipo]}</td>
                  <td className="td">
                    {c.padrao && <span className="text-[10px] text-yellow-400 border border-yellow-800/40 bg-yellow-900/20 px-2 py-0.5 rounded-full">Padrão</span>}
                  </td>
                  <td className="td text-right whitespace-nowrap">
                    <button onClick={() => setModal(c)} className="text-gray-600 hover:text-gray-300 text-xs mr-4 transition-colors">Editar</button>
                    <button onClick={() => arquivarCategoria(c.id).then(carregar)} className="text-gray-600 hover:text-yellow-400 text-xs transition-colors">Arquivar</button>
                  </td>
                </tr>
              ))}
              {mostrarArquivadas && arquivadas.map(c => (
                <tr key={c.id} className="table-row opacity-40">
                  <td className="td text-gray-500 line-through">{c.nome}</td>
                  <td className="td text-gray-600">{TIPO_LABEL[c.tipo]}</td>
                  <td className="td" />
                  <td className="td text-right">
                    <button onClick={() => arquivarCategoria(c.id).then(carregar)} className="text-teal-600 hover:text-teal-400 text-xs transition-colors">Restaurar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA CATEGORIA' : 'EDITAR CATEGORIA'} onClose={() => setModal(null)}>
          <FormCategoria inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
