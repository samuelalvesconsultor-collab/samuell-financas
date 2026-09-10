import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getCategorias, criarCategoria, atualizarCategoria, arquivarCategoria } from '../api/categorias'
import Modal from '../components/Modal'
import FormCategoria from '../components/FormCategoria'

const TIPO_LABEL = { entrada: 'Entrada', saida: 'Saída', ambos: 'Ambos' }

export default function Categorias() {
  const { setCategorias } = useApp()
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(null)
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)

  const carregar = async () => {
    if (mostrarArquivadas) {
      // Busca ativas e arquivadas separadamente e combina
      const [ativas, arquivadas] = await Promise.all([getCategorias(false), getCategorias(true)])
      const data = [...ativas, ...arquivadas]
      setLista(data)
      setCategorias(ativas)
    } else {
      const data = await getCategorias(false)
      setLista(data)
      setCategorias(data)
    }
  }

  useEffect(() => { carregar() }, [mostrarArquivadas])

  async function salvar(dados) {
    if (modal === 'novo') {
      await criarCategoria(dados)
    } else {
      await atualizarCategoria(modal.id, dados)
    }
    setModal(null)
    carregar()
  }

  async function toggleArquivar(id) {
    await arquivarCategoria(id)
    carregar()
  }

  const ativas = lista.filter(c => !c.arquivada)
  const arquivadas = lista.filter(c => c.arquivada)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-800">Categorias</h1>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={mostrarArquivadas} onChange={e => setMostrarArquivadas(e.target.checked)} />
          Mostrar arquivadas
        </label>
      </div>

      <div className="space-y-2">
        {ativas.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800 text-sm">{c.nome}</p>
              <p className="text-xs text-gray-400">{TIPO_LABEL[c.tipo]}{c.padrao ? ' · Padrão' : ''}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(c)} className="text-xs text-blue-600">Editar</button>
              <button onClick={() => toggleArquivar(c.id)} className="text-xs text-yellow-600">Arquivar</button>
            </div>
          </div>
        ))}

        {mostrarArquivadas && arquivadas.map(c => (
          <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center opacity-60">
            <div>
              <p className="font-medium text-gray-600 text-sm line-through">{c.nome}</p>
              <p className="text-xs text-gray-400">{TIPO_LABEL[c.tipo]}</p>
            </div>
            <button onClick={() => toggleArquivar(c.id)} className="text-xs text-green-600">Restaurar</button>
          </div>
        ))}

        {!lista.length && <p className="text-center text-gray-400 text-sm py-8">Nenhuma categoria encontrada.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center">+</button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'Nova Categoria' : 'Editar Categoria'} onClose={() => setModal(null)}>
          <FormCategoria inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
