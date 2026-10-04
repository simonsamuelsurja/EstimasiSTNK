/**
 * Pemilih tanggal tiga dropdown: tanggal, bulan, tahun.
 *
 * Yang tampil hanya tanggal terpilih, supaya formulir tetap ringkas. Daftar
 * pilihan baru terbuka saat salah satu bagian disentuh, dan di ponsel
 * memakai pemilih bawaan perangkat yang sudah akrab bagi staf.
 */

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const TAHUN_AWAL = 1980
const TAHUN_AKHIR = 2035
const DAFTAR_TAHUN = Array.from(
  { length: TAHUN_AKHIR - TAHUN_AWAL + 1 },
  (_, i) => TAHUN_AWAL + i,
)

/** Banyak hari dalam satu bulan, sudah memperhitungkan tahun kabisat. */
function jumlahHari(tahun: number, bulan: number): number {
  return new Date(tahun, bulan, 0).getDate()
}

function urai(iso: string): { tahun: number; bulan: number; hari: number } {
  const c = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  const kini = new Date()
  if (!c) return { tahun: kini.getFullYear(), bulan: kini.getMonth() + 1, hari: kini.getDate() }
  return { tahun: Number(c[1]), bulan: Number(c[2]), hari: Number(c[3]) }
}

const susunIso = (tahun: number, bulan: number, hari: number) =>
  `${tahun}-${String(bulan).padStart(2, '0')}-${String(hari).padStart(2, '0')}`

export function PilihTanggal({
  nilai,
  onUbah,
  label,
}: {
  nilai: string
  onUbah: (iso: string) => void
  label: string
}) {
  const { tahun, bulan, hari } = urai(nilai)
  const daftarHari = Array.from({ length: jumlahHari(tahun, bulan) }, (_, i) => i + 1)

  const ubah = (t: number, b: number, h: number) => {
    // Tanggal ikut disesuaikan saat bulan atau tahun berubah, supaya tidak
    // pernah tersusun tanggal yang tidak ada seperti 31 Februari.
    onUbah(susunIso(t, b, Math.min(h, jumlahHari(t, b))))
  }

  return (
    <div className="pilih-tanggal" role="group" aria-label={label}>
      <select
        value={hari}
        onChange={(e) => ubah(tahun, bulan, Number(e.target.value))}
        aria-label="Tanggal"
      >
        {daftarHari.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <select
        value={bulan}
        onChange={(e) => ubah(tahun, Number(e.target.value), hari)}
        aria-label="Bulan"
      >
        {NAMA_BULAN.map((n, i) => (
          <option key={n} value={i + 1}>
            {n}
          </option>
        ))}
      </select>
      <select
        value={tahun}
        onChange={(e) => ubah(Number(e.target.value), bulan, hari)}
        aria-label="Tahun"
      >
        {/* Tahun di luar jangkauan tetap ditampilkan supaya isian lama tidak
            diam-diam berubah jadi tahun lain. */}
        {!DAFTAR_TAHUN.includes(tahun) && <option value={tahun}>{tahun}</option>}
        {DAFTAR_TAHUN.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  )
}
