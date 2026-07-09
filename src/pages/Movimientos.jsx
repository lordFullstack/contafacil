import { useMemo, useState } from 'react'
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle, ChevronDown } from 'lucide-react'
import { formatCOP } from '../components/StatCard'
import TransactionForm from '../components/TransactionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getTransactions, getProviders, deleteTransaction } from '../lib/storage'

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'ingreso', label: 'Ingresos' },
  { id: 'egreso', label: 'Egresos' },
]

function dayLabel(dateKey) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateKey === todayKey) return 'Hoy'
  if (dateKey === yesterdayKey) return 'Ayer'
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  })
}

export default function Movimientos({ refreshKey, onDataChanged }) {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [expandedDays, setExpandedDays] = useState(null) // null hasta inicializar con el día más reciente

  const providers = useMemo(() => getProviders(), [refreshKey])
  const providerMap = useMemo(() => Object.fromEntries(providers.map((p) => [p.id, p.name])), [providers])

  const transactions = useMemo(() => {
    const all = getTransactions()
    if (filter === 'todos') return all
    return all.filter((t) => t.type === filter)
  }, [refreshKey, filter])

  // Agrupa por día (YYYY-MM-DD), manteniendo el orden más reciente primero
  const groups = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      const key = t.date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const ingresos = items.filter((i) => i.type === 'ingreso').reduce((s, i) => s + i.amount, 0)
      const gastos = items.filter((i) => i.type === 'egreso').reduce((s, i) => s + i.amount, 0)
      return { key, items, ingresos, gastos }
    })
  }, [transactions])

  // Por defecto, solo el día más reciente queda expandido — así no hay que hacer scroll
  // por todo el historial para ver los movimientos de hoy.
  const effectiveExpanded = useMemo(() => {
    if (expandedDays !== null) return expandedDays
    return groups.length > 0 ? new Set([groups[0].key]) : new Set()
  }, [expandedDays, groups])

  function toggleDay(key) {
    const next = new Set(effectiveExpanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpandedDays(next)
  }

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
        <p className="text-sm text-slate-500">Historial agrupado por día</p>
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

      {/* Grupos por día */}
      <div className="mx-5 mt-4 space-y-3 md:mx-0">
        {groups.length === 0 && (
          <div className="rounded-2xl border border-base-700 bg-base-900 p-4 text-sm text-slate-500 shadow-card">
            No hay movimientos para este filtro.
          </div>
        )}

        {groups.map((group) => {
          const isOpen = effectiveExpanded.has(group.key)
          const net = group.ingresos - group.gastos

          return (
            <div key={group.key} className="overflow-hidden rounded-2xl border border-base-700 bg-base-900 shadow-card">
              <button
                onClick={() => toggleDay(group.key)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold capitalize text-slate-200">{dayLabel(group.key)}</p>
                  <p className="text-xs text-slate-500">
                    {group.items.length} {group.items.length === 1 ? 'movimiento' : 'movimientos'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-semibold ${net >= 0 ? 'text-ingreso' : 'text-egreso'}`}>
                    {net >= 0 ? '+' : ''}
                    {formatCOP(net)}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-base-700 border-t border-base-700">
                  {group.items.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      {t.type === 'ingreso' ? (
                        <ArrowUpCircle size={20} className="shrink-0 text-ingreso" />
                      ) : (
                        <ArrowDownCircle size={20} className="shrink-0 text-egreso" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {t.description || t.category}
                        </p>
                        <p className="truncate text-xs text-slate-500">
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
              )}
            </div>
          )
        })}
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
              ? `Vas a eliminar un ingreso de ${formatCOP(pendingDelete.amount)}.\n\nEsto SÍ restará ese monto de tu saldo en efectivo (el saldo es la suma de los ingresos). ¿Confirmas?`
              : `Vas a eliminar un gasto de ${formatCOP(pendingDelete.amount)}.\n\nEsto solo lo quita del control de gastos, NO afecta tu saldo en efectivo. ¿Confirmas?`
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
