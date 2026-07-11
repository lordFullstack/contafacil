// Convierte una fecha a su "llave de día" (YYYY-MM-DD) usando la ZONA HORARIA LOCAL
// del dispositivo, no UTC. Esto es clave: los timestamps se guardan en UTC (como ISO),
// pero "qué día es" para el usuario depende de su hora local (Colombia = UTC-5).
// Usar .toISOString().slice(0,10) o .slice(0,10) directo sobre un ISO string
// da el día en UTC, lo cual puede estar "adelantado" hasta 5 horas de noche.
export function localDateKey(dateInput = new Date()) {
  const d = new Date(dateInput)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey() {
  return localDateKey(new Date())
}
