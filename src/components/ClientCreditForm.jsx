import { useState } from 'react'
import { X } from 'lucide-react'
import { addClientCredit } from '../lib/storage'

export default function ClientCreditForm({ customers, defaultCustomerId, onClose, onSaved }) {
  const [customerId, setCustomerId] = useState(defaultCustomerId || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerId || !amount || Number(amount) <= 0) return
    setSaving(true)
    setError('')
    try {
      await addClientCredit({
        customerId,
        amount,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el crédito.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-base-700 bg-base-900 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-100">Nuevo crédito (fiado)</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-base-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Cliente</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            >
              <option value="">Selecciona un cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Monto fiado (COP)</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 font-mono text-lg text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Mercado de la semana"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Fecha límite de pago (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-tealed [color-scheme:dark]"
            />
          </div>

          {error && <p className="text-xs text-egreso">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-tealed py-3.5 text-center font-semibold text-base-950 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar crédito'}
          </button>
        </form>
      </div>
    </div>
  )
}
