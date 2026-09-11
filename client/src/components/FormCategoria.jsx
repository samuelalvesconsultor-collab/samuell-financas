import { useState } from 'react'

const VAZIO = { nome: '', tipo: 'ambos', cor: null }

const CORES = [
  { hex: '#00e676', label: 'Verde neon'   },
  { hex: '#ff1744', label: 'Vermelho neon'},
  { hex: '#a78bfa', label: 'Roxo'         },
  { hex: '#60a5fa', label: 'Azul'         },
  { hex: '#14b8a6', label: 'Teal'         },
  { hex: '#34d399', label: 'Verde suave'  },
  { hex: '#f59e0b', label: 'Âmbar'        },
  { hex: '#fb923c', label: 'Laranja'      },
  { hex: '#f472b6', label: 'Rosa'         },
  { hex: '#facc15', label: 'Amarelo'      },
  { hex: '#818cf8', label: 'Índigo'       },
  { hex: '#6b7280', label: 'Cinza'        },
]

export default function FormCategoria({ inicial, onSalvar, onCancelar }) {
  const [form, setForm] = useState(inicial ? { nome: inicial.nome, tipo: inicial.tipo, cor: inicial.cor || null } : VAZIO)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSalvar(form)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input required placeholder="Nome" value={form.nome}
        onChange={e => set('nome', e.target.value)} className="input-dark" />

      <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="select-dark">
        <option value="ambos">Entrada e Saída</option>
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
      </select>

      {/* Seletor de cor */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
          Cor do card
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Opção "sem cor" */}
          <button
            type="button"
            title="Sem cor"
            onClick={() => set('cor', null)}
            className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              background: 'var(--card-alt)',
              borderColor: form.cor === null ? 'white' : 'var(--card-border)',
              boxShadow: form.cor === null ? '0 0 0 2px rgba(255,255,255,0.2)' : 'none',
            }}
          >
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>✕</span>
          </button>

          {CORES.map(({ hex, label }) => {
            const ativo = form.cor === hex
            return (
              <button
                key={hex}
                type="button"
                title={label}
                onClick={() => set('cor', hex)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  background: hex,
                  borderColor: ativo ? 'white' : 'transparent',
                  boxShadow: ativo ? `0 0 0 2px ${hex}66, 0 0 8px ${hex}55` : 'none',
                  transform: ativo ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            )
          })}
        </div>

        {/* Preview da cor selecionada */}
        {form.cor && (
          <div className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: `${form.cor}15`, border: `1px solid ${form.cor}40` }}>
            <div className="w-3 h-3 rounded-full" style={{ background: form.cor }} />
            <span className="text-xs font-medium" style={{ color: form.cor }}>{form.cor}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary">Salvar</button>
      </div>
    </form>
  )
}
