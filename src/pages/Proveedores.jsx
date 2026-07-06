import { useMemo, useState } from 'react'
import { Plus, Phone, CreditCard, CheckCircle2, Trash2 } from 'lucide-react'
import { formatCOP } from '../components/StatCard'
import ProviderForm from '../components/ProviderForm'
import TransactionForm from '../components/TransactionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getProviders, getCredits, markCreditPaid, deleteProvider } from '../lib/storage'

export default function Proveedores({ refreshKey, onDataChanged }) {
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [payingProvider, setPayingProvider] = useState(null)
  const [pendingCredit, setPendingCredit] = useState(null) // { id, amount, providerName }

  const providers = useMemo(() => getProviders(), [refreshKey])
  const credits = useMemo(() => getCredits(), [refreshKey])

  const creditsByProvider = useMemo(() => {
    const map = {}
    credits
      .filter((c) => c.status === 'pendiente')
      .forEach((c) => {
        map[c.providerId] = map[c.providerId] || []
        map[c.providerId].push(c)
      })
    return map
  }, [credits])

  function confirmPayCredit() {
    if (!pendingCredit) return
    markCreditPaid(pendingCredit.id)
    setPendingCredit(null)
    onDataChanged()
  }

  function handleDeleteProvider(id) {
    if (creditsByProvider[id]?.length) {
      alert('Este proveedor tiene créditos pendientes. Salda o elimina los créditos primero.')
      return
    }
    deleteProvider(id)
    onDataChanged()
  }

  return (
    <div className="pb-28 md:pb-10">
      <header className="px-5 pt-6 pb-4 md:px-0">
        <h1 className="font-display text-2xl font-bold text-slate-50">Proveedores</h1>
        <p className="text-sm text-slate-500">{providers.length} registrados</p>
      </header>

      <div className="mx-5 grid grid-cols-1 gap-3 md:mx-0 md:grid-cols-2">
        {providers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-base-600 p-6 text-center text-sm text-slate-500 md:col-span-2">
            Aún no tienes proveedores. Agrega el primero con el botón +.
          </div>
        )}

        {providers.map((p) => {
          const pending = creditsByProvider[p.id] || []
          const totalPending = pending.reduce((s, c) => s + c.amount, 0)

          return (
            <div key={p.id} className="rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category}{p.nit ? ` · NIT ${p.nit}` : ''}</p>
                  {p.phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Phone size={12} /> {p.phone}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteProvider(p.id)}
                  className="rounded-full p-1.5 text-slate-600 hover:bg-base-800 hover:text-egreso"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {pending.length > 0 && (
                <div className="mt-3 rounded-xl bg-base-800 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-brand-gold">
                      Créditos pendientes
                    </span>
                    <span className="font-mono text-sm font-semibold text-brand-gold">
                      {formatCOP(totalPending)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pending.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-slate-300">{c.description || 'Crédito'}</p>
                          {c.dueDate && (
                            <p className="text-xs text-slate-500">
                              Vence: {new Date(c.dueDate).toLocaleDateString('es-CO')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300">{formatCOP(c.amount)}</span>
                          <button
                            onClick={() => setPendingCredit({ id: c.id, amount: c.amount, providerName: p.name })}
                            className="text-ingreso hover:text-ingreso/80"
                            title="Marcar como pagado"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setPayingProvider(p)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-base-600 py-2.5 text-sm font-medium text-slate-200 active:scale-[0.98]"
              >
                <CreditCard size={16} /> Registrar pago
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setShowProviderForm(true)}
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tealed text-base-950 shadow-lg active:scale-95 md:bottom-8"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showProviderForm && (
        <ProviderForm
          onClose={() => setShowProviderForm(false)}
          onSaved={() => {
            setShowProviderForm(false)
            onDataChanged()
          }}
        />
      )}

      {payingProvider && (
        <TransactionForm
          providers={providers}
          defaultType="egreso"
          onClose={() => setPayingProvider(null)}
          onSaved={() => {
            setPayingProvider(null)
            onDataChanged()
          }}
        />
      )}

      {pendingCredit && (
        <ConfirmDialog
          title="Confirmar pago de crédito"
          message={`Vas a pagar ${formatCOP(pendingCredit.amount)} a ${pendingCredit.providerName}.\n\nEsto descontará el monto de tu saldo en efectivo. ¿Confirmas?`}
          confirmLabel="Sí, pagar"
          cancelLabel="Cancelar"
          tone="egreso"
          onConfirm={confirmPayCredit}
          onCancel={() => setPendingCredit(null)}
        />
      )}
    </div>
  )
}
