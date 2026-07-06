import { LayoutGrid, ArrowLeftRight, Users } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { id: 'proveedores', label: 'Proveedores', icon: Users },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-base-700 bg-base-900/95 backdrop-blur safe-bottom md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 1.8}
                className={isActive ? 'text-brand-gold' : 'text-slate-500'}
              />
              <span
                className={`text-[11px] font-medium ${
                  isActive ? 'text-brand-gold' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
