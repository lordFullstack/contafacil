import { useMemo, useState } from 'react'
import { Plus, Phone, HandCoins, CheckCircle2, Trash2 } from 'lucide-react'
import { formatCOP } from '../components/StatCard'
import CustomerForm from '../components/CustomerForm'
import ClientCreditForm from '../components/ClientCreditForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getCustomers, getClientCredits, markClientCreditPaid, deleteCustomer } from '../lib/storage'

export default function Clientes({ refreshKey, onDataChanged }) {
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [creditingCustomerId, setCreditingCustomerId] = useState(null) // string | null
  const [pendingCollect, setPendingCollect] = useState(null) // { id, amount, customerName }

  const customers = useMemo(() => getCustomers(), [refreshKey])
  const credits = useMemo(() => getClientCredits(), [refreshKey])

  const creditsByCustomer = useMemo(() => {
    const map = {}
    credits
      .filter((c) => c.status === 'pendiente')
      .forEach((c) => {
        map[c.customerId] = map[c.customerId] || []
        map[c.customerId].push(c)
      })
    return map
  }, [credits])

  function confirmCollect() {
    if (!pendingCollect) return
    markClientCreditPaid(pendingCollect.id)
    setPendingCollect(null)
    onDataChanged()
  }

  function handleDeleteCustomer(id) {
    if (creditsByCustomer[id]?.length) {
      alert('Este cliente tiene créditos pendientes. Cóbralos o elimínalos primero.')
      return
    }
    deleteCustomer(id)
    onDataChanged()
  }

  return (
    <div className="pb-28 md:pb-10">
      <header className="px-5 pt-6 pb-4 md:px-0">
        <h1 className="font-display text-2xl font-bold text-slate-50">Clientes</h1>
        <p className="text-sm text-slate-500">{customers.length} registrados · fiados (cuentas por cobrar)</p>
      </header>

      <div className="mx-5 grid grid-cols-1 gap-3 md:mx-0 md:grid-cols-2">
        {customers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-base-600 p-6 text-center text-sm text-slate-500 md:col-span-2">
            Aún no tienes clientes. Agrega el primero con el botón +.
          </div>
        )}

        {customers.map((c) => {
          const pending = creditsByCustomer[c.id] || []
          const totalPending = pending.reduce((s, cr) => s + cr.amount, 0)

          return (
            <div key={c.id} className="rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold text-slate-100">{c.name}</p>
                  {c.notes && <p className="text-xs text-slate-500">{c.notes}</p>}
                  {c.phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Phone size={12} /> {c.phone}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCustomer(c.id)}
                  className="rounded-full p-1.5 text-slate-600 hover:bg-base-800 hover:text-egreso"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {pending.length > 0 && (
                <div className="mt-3 rounded-xl bg-base-800 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-brand-tealed">
                      Debe (fiado)
                    </span>
                    <span className="font-mono text-sm font-semibold text-brand-tealed">
                      {formatCOP(totalPending)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pending.map((cr) => (
                      <div key={cr.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-slate-300">{cr.description || 'Fiado'}</p>
                          {cr.dueDate && (
                            <p className="text-xs text-slate-500">
                              Vence: {new Date(cr.dueDate).toLocaleDateString('es-CO')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300">{formatCOP(cr.amount)}</span>
                          <button
                            onClick={() =>
                              setPendingCollect({ id: cr.id, amount: cr.amount, customerName: c.name })
                            }
                            className="text-ingreso hover:text-ingreso/80"
                            title="Marcar como cobrado"
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
                onClick={() => setCreditingCustomerId(c.id)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-base-600 py-2.5 text-sm font-medium text-slate-200 active:scale-[0.98]"
              >
                <HandCoins size={16} /> Registrar fiado
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setShowCustomerForm(true)}
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tealed text-base-950 shadow-lg active:scale-95 md:bottom-8"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showCustomerForm && (
        <CustomerForm
          onClose={() => setShowCustomerForm(false)}
          onSaved={() => {
            setShowCustomerForm(false)
            onDataChanged()
          }}
        />
      )}

      {creditingCustomerId && (
        <ClientCreditForm
          customerId={creditingCustomerId}
          onClose={() => setCreditingCustomerId(null)}
          onSaved={() => {
            setCreditingCustomerId(null)
            onDataChanged()
          }}
        />
      )}

      {pendingCollect && (
        <ConfirmDialog
          title="Confirmar cobro de fiado"
          message={`Vas a registrar el cobro de ${formatCOP(pendingCollect.amount)} a ${pendingCollect.customerName}.\n\nEste monto se guarda en el control de ingresos. ¿Confirmas?`}
          confirmLabel="Sí, registrar"
          cancelLabel="Cancelar"
          tone="ingreso"
          onConfirm={confirmCollect}
          onCancel={() => setPendingCollect(null)}
        />
      )}
    </div>
  )
}
