const PALETTES = [
  'bg-blue-900/40 text-blue-300',
  'bg-purple-900/40 text-purple-300',
  'bg-emerald-900/40 text-emerald-300',
  'bg-orange-900/40 text-orange-300',
  'bg-pink-900/40 text-pink-300',
  'bg-teal-900/40 text-teal-300',
  'bg-indigo-900/40 text-indigo-300',
  'bg-yellow-900/40 text-yellow-300',
]

function hashStr(s) {
  let h = 0
  for (const c of s || '') h = ((h << 5) - h) + c.charCodeAt(0)
  return Math.abs(h)
}

export default function CategoryBadge({ nome }) {
  if (!nome) return <span className="text-gray-600 text-xs">—</span>
  const cls = PALETTES[hashStr(nome) % PALETTES.length]
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {nome}
    </span>
  )
}
