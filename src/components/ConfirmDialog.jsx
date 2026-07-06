import { AlertTriangle } from 'lucide-react'

/**
 * Cuadro de confirmación propio (reemplaza window.confirm).
 * Se usa para CUALQUIER acción que afecte el saldo en efectivo real,
 * para que el usuario dé su permiso explícito antes de que se descuente.
 */
export default function ConfirmDialog({
  title = '¿Confirmas esta acción?',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'egreso', // 'egreso' | 'neutral'
  onConfirm,
  onCancel,
}) {
  const confirmColor =
    tone === 'egreso' ? 'bg-egreso text-white' : 'bg-brand-gold text-base-950'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-2xl border border-base-700 bg-base-900 p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              tone === 'egreso' ? 'bg-egreso/15 text-egreso' : 'bg-brand-gold/15 text-brand-gold'
            }`}
          >
            <AlertTriangle size={18} />
          </span>
          <h2 className="font-display text-base font-semibold text-slate-100">{title}</h2>
        </div>

        <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-slate-400">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-base-600 py-2.5 text-sm font-medium text-slate-300 active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold active:scale-[0.98] ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
