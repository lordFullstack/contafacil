# ContaFácil — Prototipo local (sin backend)

Prototipo funcional de app contable para negocios en Colombia. Todos los datos
viven en el `localStorage` del navegador — no hay servidor, base de datos ni
autenticación. Ideal para demo inmediata con el cliente.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre la URL que te da Vite (normalmente `http://localhost:5173`) en tu
celular y en tu computador — cada navegador guarda sus propios datos de forma
independiente (por eso no verás los mismos datos en dos dispositivos: eso es
justamente lo que se resuelve en la fase 2 con Supabase).

Para generar una build estática que puedas subir a GitHub Pages, Netlify o
simplemente abrir como archivo local:

```bash
npm run build
npm run preview   # para probar la build antes de publicarla
```

## Estructura del proyecto

```
contafacil/
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx                # enrutamiento por pestañas + bottom nav
│   ├── index.css              # Tailwind + ajustes móviles
│   ├── lib/
│   │   ├── storage.js         # TODA la lógica de localStorage vive aquí
│   │   └── export.js          # export a CSV y backup JSON (Blob + URL.createObjectURL)
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── StatCard.jsx
│   │   ├── TransactionForm.jsx
│   │   └── ProviderForm.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Movimientos.jsx
│       └── Proveedores.jsx
```

## Modelo de datos (localStorage)

- `cf_transactions`: `{ id, type: 'ingreso'|'egreso', amount, category, description, date, providerId? }`
- `cf_providers`: `{ id, name, nit, phone, category, createdAt }`
- `cf_credits`: `{ id, providerId, amount, description, date, dueDate, status: 'pendiente'|'pagado' }`
- `cf_settings`: `{ companyName, primaryColor, secondaryColor }`

La app carga datos de ejemplo automáticamente la primera vez (localStorage
vacío), para que el dashboard no se vea vacío en la demo.

## Ruta de migración a Supabase/Firebase

Toda la lectura/escritura pasa por `src/lib/storage.js`. Cuando quieras que
los datos sean multi-dispositivo, solo tienes que reemplazar el contenido de
esas funciones (`getTransactions`, `addTransaction`, etc.) por llamadas a
Supabase, manteniendo la misma firma de entrada/salida. Ningún componente de
`pages/` o `components/` necesita cambiar.
