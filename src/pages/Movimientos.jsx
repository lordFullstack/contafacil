import { useMemo, useState } from 'react'
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { formatCOP } from '../components/StatCard'
import TransactionForm from '../components/TransactionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getTransactions, getProviders, deleteTransaction } from '../lib/storage'

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'ingreso', label: 'Ingresos' },
  { id: 'egreso', label: 'Egresos' },
]

export default function Movimientos({ refreshKey, onDataChanged }) {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [pendingDelete, setPendingDelete] = useState(null) // transacción completa

  const providers = useMemo(() => getProviders(), [refreshKey])
  const providerMap = useMemo(() => Object.fromEntries(providers.map((p) => [p.id, p.name])), [providers])

  const transactions = useMemo(() => {
    const all = getTransactions()
    if (filter === 'todos') return all
    return all.filter((t) => t.type === filter)
  }, [refreshKey, filter])

  function confirmDelete() {
    if (!pendingDelete) return
    deleteTransaction(pendingDelete.id)
    setPendingDelete(null)
    onDataChanged()
  }

  return (
    <div className="pb-28 md:pb-10">
      <header className="px-5 pt-6 pb-4 md:px-0">
        <h1 className="font-display text-2xl font-bold text-slate-50">Movimientos</h1>
        <p className="text-sm text-slate-500">Historial de ingresos y egresos</p>
      </header>

      {/* Filtros */}
      <div className="flex gap-2 px-5 md:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-brand-gold text-base-950'
                : 'border border-base-600 text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mx-5 mt-4 divide-y divide-base-700 rounded-2xl border border-base-700 bg-base-900 shadow-card md:mx-0">
        {transactions.length === 0 && (
          <p className="p-4 text-sm text-slate-500">No hay movimientos para este filtro.</p>
        )}
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            {t.type === 'ingreso' ? (
              <ArrowUpCircle size={22} className="shrink-0 text-ingreso" />
            ) : (
              <ArrowDownCircle size={22} className="shrink-0 text-egreso" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">
                {t.description || t.category}
              </p>
              <p className="truncate text-xs text-slate-500">
                {new Date(t.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                {t.category}
                {t.providerId && providerMap[t.providerId] ? ` · ${providerMap[t.providerId]}` : ''}
              </p>
            </div>
            <span
              className={`shrink-0 font-mono text-sm font-semibold ${
                t.type === 'ingreso' ? 'text-ingreso' : 'text-egreso'
              }`}
            >
              {t.type === 'ingreso' ? '+' : '-'}
              {formatCOP(t.amount)}
            </span>
            <button
              onClick={() => setPendingDelete(t)}
              className="shrink-0 rounded-full p-1.5 text-slate-600 hover:bg-base-800 hover:text-egreso"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-base-950 shadow-lg active:scale-95 md:bottom-8"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showForm && (
        <TransactionForm
          providers={providers}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            onDataChanged()
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar movimiento"
          message={
            pendingDelete.type === 'ingreso'
              ? `Vas a eliminar un ingreso de ${formatCOP(pendingDelete.amount)}.\n\nEsto RESTARÁ ese monto de tu saldo en efectivo. ¿Confirmas?`
              : `Vas a eliminar un egreso de ${formatCOP(pendingDelete.amount)}.\n\nEsto SUMARÁ ese monto de vuelta a tu saldo en efectivo. ¿Confirmas?`
          }
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          tone="egreso"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
