/** Pemformat angka dan tanggal dalam kebiasaan Indonesia. */

const pemformat = new Intl.NumberFormat('id-ID')

export function rupiah(nilai: number): string {
  return 'Rp ' + pemformat.format(Math.round(nilai))
}

/** Tanpa awalan "Rp", untuk kolom angka yang sudah jelas satuannya. */
export function angkaRupiah(nilai: number): string {
  return pemformat.format(Math.round(nilai))
}

/** Membaca angka yang diketik pengguna, memaklumi titik dan spasi. */
export function bacaAngka(teks: string): number {
  const bersih = (teks ?? '').replace(/[^\d]/g, '')
  return bersih ? Number(bersih) : 0
}

/** Membaca nominal rupiah atau penjumlahannya, tanpa menjalankan kode masukan. */
export function bacaPenjumlahanRupiah(teks: string): number | null {
  if (!teks.trim()) return 0
  const bagian = teks.split('+').map((angka) => angka.trim())
  if (bagian.some((angka) => !/^\d+(?:\.\d{3})*$/.test(angka))) return null
  const total = bagian.reduce((jumlah, angka) => jumlah + Number(angka.replace(/\./g, '')), 0)
  return Number.isSafeInteger(total) ? total : null
}

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/** `2024-06-21` jadi `21 Juni 2024`. */
export function tanggalPanjang(iso: string): string {
  const c = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  if (!c) return '—'
  return `${Number(c[3])} ${NAMA_BULAN[Number(c[2]) - 1]} ${c[1]}`
}

export function tanggalHariIni(): string {
  const k = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${k.getFullYear()}-${p(k.getMonth() + 1)}-${p(k.getDate())}`
}
