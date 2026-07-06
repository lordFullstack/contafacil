import { useState } from 'react'
import { X } from 'lucide-react'
import { addProvider } from '../lib/storage'

export default function ProviderForm({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [nit, setNit] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    addProvider({ name, nit, phone, category })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-base-700 bg-base-900 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-100">Nuevo proveedor</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-base-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Nombre / Razón social</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Distribuidora La 70"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">NIT (opcional)</label>
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="900123456-1"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Teléfono (opcional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="300 123 4567"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Categoría (opcional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Insumos, oficina, transporte..."
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-tealed py-3.5 text-center font-semibold text-base-950 active:scale-[0.98]"
          >
            Guardar proveedor
          </button>
        </form>
      </div>
    </div>
  )
}
