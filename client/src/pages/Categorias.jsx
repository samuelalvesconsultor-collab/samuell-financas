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
      const [ativas, arquivadas] = await Promise.all([getCategorias(false), getCategorias(true)])
      setLista([...ativas, ...arquivadas])
      setCategorias(ativas)
    } else {
      const data = await getCategorias(false)
      setLista(data)
      setCategorias(data)
    }
  }

  useEffect(() => { carregar() }, [mostrarArquivadas])

  async function salvar(dados) {
    if (modal === 'novo') await criarCategoria(dados)
    else await atualizarCategoria(modal.id, dados)
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
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-4">
        <h1 className="font-display text-sm tracking-widest text-gray-200 uppercase">Categorias</h1>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" checked={mostrarArquivadas} onChange={e => setMostrarArquivadas(e.target.checked)}
            className="accent-accent" />
          Arquivadas
        </label>
      </div>

      <div className="space-y-2">
        {ativas.map(c => (
          <div key={c.id} className="card-dark px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-100 text-sm">{c.nome}</p>
              <p className="text-xs text-muted mt-0.5">{TIPO_LABEL[c.tipo]}{c.padrao ? ' · Padrão' : ''}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setModal(c)} className="text-xs text-gray-400 hover:text-gray-100">Editar</button>
              <button onClick={() => toggleArquivar(c.id)} className="text-xs text-yellow-500 hover:text-yellow-400">Arquivar</button>
            </div>
          </div>
        ))}

        {mostrarArquivadas && arquivadas.map(c => (
          <div key={c.id} className="bg-surface border border-rim/50 rounded-xl px-4 py-3 flex justify-between items-center opacity-50">
            <div>
              <p className="font-medium text-gray-500 text-sm line-through">{c.nome}</p>
              <p className="text-xs text-muted">{TIPO_LABEL[c.tipo]}</p>
            </div>
            <button onClick={() => toggleArquivar(c.id)} className="text-xs text-teal-500 hover:text-teal-400">Restaurar</button>
          </div>
        ))}

        {!lista.length && <p className="text-center text-muted text-sm py-10">Nenhuma categoria encontrada.</p>}
      </div>

      <button onClick={() => setModal('novo')}
        className="fixed bottom-20 md:bottom-6 right-4 w-12 h-12 bg-accent hover:bg-red-700 text-white rounded-full text-2xl shadow-lg flex items-center justify-center transition-colors">
        +
      </button>

      {modal && (
        <Modal titulo={modal === 'novo' ? 'NOVA CATEGORIA' : 'EDITAR CATEGORIA'} onClose={() => setModal(null)}>
          <FormCategoria inicial={modal !== 'novo' ? modal : undefined} onSalvar={salvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
