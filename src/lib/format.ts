// Helper format & periode tanggal (zona waktu perangkat)

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(n: number): string {
  return rupiah.format(Math.round(n))
}

// Versi singkat untuk grafik/kartu: 1.250.000 -> "Rp1,3 jt", 85.000 -> "Rp85 rb"
export function formatRupiahShort(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `Rp${trim(n / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `Rp${trim(n / 1_000_000)} jt`
  if (abs >= 1_000) return `Rp${trim(n / 1_000)} rb`
  return `Rp${Math.round(n)}`
}

function trim(v: number): string {
  const s = v.toFixed(1).replace('.0', '')
  return s.replace('.', ',')
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function formatDate(d: Date | number): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(d: Date | number): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(d: Date | number): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay() // 0 = Minggu
  x.setDate(x.getDate() - day)
  return x
}

export function startOfMonth(d: Date): Date {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}
