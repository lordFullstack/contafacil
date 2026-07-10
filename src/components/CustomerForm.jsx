import { useState } from 'react'
import { X } from 'lucide-react'
import { addCustomer } from '../lib/storage'

export default function CustomerForm({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await addCustomer({ name, phone, notes })
      onSaved()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cliente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-base-700 bg-base-900 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-100">Nuevo cliente</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-base-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Nombre del cliente</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
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
            <label className="mb-1 block text-xs font-medium text-slate-400">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: cliente frecuente"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          {error && <p className="text-xs text-egreso">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-tealed py-3.5 text-center font-semibold text-base-950 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </form>
      </div>
    </div>
  )
}
