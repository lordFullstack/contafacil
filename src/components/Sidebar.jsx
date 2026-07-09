import { LayoutGrid, ArrowLeftRight, Users, Wallet, HandCoins } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { id: 'proveedores', label: 'Proveedores', icon: Users },
  { id: 'clientes', label: 'Clientes', icon: HandCoins },
]

export default function Sidebar({ active, onChange, companyName }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-base-700 bg-base-900 md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
          <Wallet size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{companyName}</p>
          <p className="text-xs text-slate-500">ContaFácil</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-gold/15 text-brand-gold'
                  : 'text-slate-400 hover:bg-base-800 hover:text-slate-200'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
