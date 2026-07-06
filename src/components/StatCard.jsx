export function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default function StatCard({ label, value, icon: Icon, tone = 'neutral' }) {
  const toneClasses = {
    ingreso: 'text-ingreso',
    egreso: 'text-egreso',
    neutral: 'text-brand-gold',
  }[tone]

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {Icon && <Icon size={16} className={toneClasses} strokeWidth={2} />}
      </div>
      <p className={`mt-2 font-mono text-xl font-semibold tabular-nums ${toneClasses}`}>
        {formatCOP(value)}
      </p>
    </div>
  )
}
