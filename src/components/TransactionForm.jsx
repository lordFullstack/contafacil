import { useState } from 'react'
import { X } from 'lucide-react'
import { addTransaction, payProvider } from '../lib/storage'
import ConfirmDialog from './ConfirmDialog'
import { formatCOP } from './StatCard'

const CATEGORIES = {
  ingreso: ['Ventas', 'Servicios', 'Otro ingreso'],
  egreso: ['Pago a proveedor', 'Servicios', 'Arriendo', 'Nómina', 'Otro gasto'],
}

export default function TransactionForm({ providers, onClose, onSaved, defaultType = 'ingreso' }) {
  const [type, setType] = useState(defaultType)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[defaultType][0])
  const [description, setDescription] = useState('')
  const [providerId, setProviderId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)) // YYYY-MM-DD, hoy por defecto
  const [pendingSave, setPendingSave] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTypeChange(next) {
    setType(next)
    setCategory(CATEGORIES[next][0])
    if (next === 'ingreso') setProviderId('')
  }

  // Convierte "YYYY-MM-DD" (del input) a un ISO con la hora actual,
  // para no perder el orden de "más reciente primero" entre movimientos del mismo día.
  function dateToISO(dateStr) {
    const now = new Date()
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString()
  }

  async function commitSave() {
    setSaving(true)
    setError('')
    try {
      const isoDate = dateToISO(date)
      if (category === 'Pago a proveedor' && providerId) {
        await payProvider({ providerId, amount, description, date: isoDate })
      } else {
        await addTransaction({ type, amount, category, description, providerId: providerId || null, date: isoDate })
      }
      setPendingSave(false)
      onSaved()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el movimiento.')
      setPendingSave(false)
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    // Cualquier egreso pide permiso explícito antes de descontar saldo real
    if (type === 'egreso') {
      setPendingSave(true)
      return
    }
    commitSave()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-base-700 bg-base-900 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-100">Nuevo movimiento</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-base-800">
            <X size={20} />
          </button>
        </div>

        {/* Selector de tipo */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-base-800 p-1">
          <button
            type="button"
            onClick={() => handleTypeChange('ingreso')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              type === 'ingreso' ? 'bg-ingreso/15 text-ingreso' : 'text-slate-400'
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('egreso')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              type === 'egreso' ? 'bg-egreso/15 text-egreso' : 'text-slate-400'
            }`}
          >
            Egreso
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Fecha</label>
            <input
              type="date"
              required
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-gold [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Monto (COP)</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 font-mono text-lg text-slate-100 outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-gold"
            >
              {CATEGORIES[type].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {category === 'Pago a proveedor' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Proveedor</label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
                className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-gold"
              >
                <option value="">Selecciona un proveedor</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Venta de mostrador"
              className="w-full rounded-xl border border-base-600 bg-base-800 px-4 py-3 text-slate-100 outline-none focus:border-brand-gold"
            />
          </div>

          {error && <p className="text-xs text-egreso">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-gold py-3.5 text-center font-semibold text-base-950 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </form>
      </div>

      {pendingSave && (
        <ConfirmDialog
          title="Confirmar gasto"
          message={`Vas a registrar un gasto de ${formatCOP(Number(amount))}.\n\nEste monto se guarda por separado, en el control de gastos. NO afecta tu saldo en efectivo. ¿Confirmas?`}
          confirmLabel={saving ? 'Guardando...' : 'Sí, registrar'}
          cancelLabel="Cancelar"
          tone="egreso"
          onConfirm={commitSave}
          onCancel={() => setPendingSave(false)}
        />
      )}
    </div>
  )
}
