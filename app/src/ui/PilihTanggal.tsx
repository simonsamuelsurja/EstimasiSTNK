/**
 * Pemilih tanggal bergulir.
 *
 * Kalender bawaan peramban menuntut ketepatan menekan kotak kecil dan berpindah
 * bulan satu per satu — menyulitkan saat dipakai satu tangan sambil berdiri,
 * apalagi untuk STNK yang jatuh temponya bisa bertahun-tahun ke belakang.
 * Tiga kolom bergulir membuat tahun yang jauh bisa dicapai dengan satu usapan.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** Tinggi satu baris, harus sama dengan nilai di berkas gaya. */
const TINGGI_BARIS = 40

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

  const tahunIni = new Date().getFullYear()
  // STNK yang diurus bisa tertunggak bertahun-tahun, jadi jangkauannya lebar
  // ke belakang. Ke depan cukup dua tahun untuk masa berlaku yang belum jatuh.
  const daftarTahun = Array.from({ length: 18 }, (_, i) => tahunIni - 15 + i)
  const daftarBulan = NAMA_BULAN.map((n, i) => ({ nilai: i + 1, teks: n }))
  const daftarHari = Array.from({ length: jumlahHari(tahun, bulan) }, (_, i) => i + 1)

  const ubah = (t: number, b: number, h: number) => {
    // Tanggal ikut disesuaikan saat bulan atau tahun berubah, supaya tidak
    // pernah tersusun tanggal yang tidak ada seperti 31 Februari.
    const maksimal = jumlahHari(t, b)
    onUbah(susunIso(t, b, Math.min(h, maksimal)))
  }

  return (
    <div className="roda" role="group" aria-label={label}>
      <Kolom
        namaKolom="Tanggal"
        pilihan={daftarHari.map((h) => ({ nilai: h, teks: String(h) }))}
        terpilih={hari}
        onPilih={(h) => ubah(tahun, bulan, h)}
      />
      <Kolom
        namaKolom="Bulan"
        pilihan={daftarBulan}
        terpilih={bulan}
        onPilih={(b) => ubah(tahun, b, hari)}
      />
      <Kolom
        namaKolom="Tahun"
        pilihan={daftarTahun.map((t) => ({ nilai: t, teks: String(t) }))}
        terpilih={tahun}
        onPilih={(t) => ubah(t, bulan, hari)}
      />
      <div className="roda-penanda" aria-hidden="true" />
    </div>
  )
}

interface Pilihan {
  nilai: number
  teks: string
}

function Kolom({
  namaKolom,
  pilihan,
  terpilih,
  onPilih,
}: {
  namaKolom: string
  pilihan: Pilihan[]
  terpilih: number
  onPilih: (n: number) => void
}) {
  const wadah = useRef<HTMLDivElement>(null)
  const jedaGulir = useRef<number | undefined>(undefined)
  // Menandai gulir yang dipicu kode sendiri, supaya tidak dibaca sebagai
  // pilihan baru dari pengguna dan memantul bolak-balik.
  const gulirSendiri = useRef(false)
  const [sedangGulir, setSedangGulir] = useState(false)

  const indeks = Math.max(0, pilihan.findIndex((p) => p.nilai === terpilih))

  const geserKe = useCallback((ke: number, halus: boolean) => {
    const el = wadah.current
    if (!el) return
    gulirSendiri.current = true
    el.scrollTo({ top: ke * TINGGI_BARIS, behavior: halus ? 'smooth' : 'auto' })
    window.clearTimeout(jedaGulir.current)
    jedaGulir.current = window.setTimeout(() => {
      gulirSendiri.current = false
    }, halus ? 400 : 60)
  }, [])

  // Menyelaraskan posisi gulir ketika nilainya berubah dari luar.
  useEffect(() => {
    const el = wadah.current
    if (!el || sedangGulir) return
    if (Math.round(el.scrollTop / TINGGI_BARIS) !== indeks) geserKe(indeks, false)
  }, [indeks, sedangGulir, geserKe])

  const padaGulir = () => {
    if (gulirSendiri.current) return
    setSedangGulir(true)
    window.clearTimeout(jedaGulir.current)
    // Gulir di ponsel punya momentum, jadi nilainya baru dibaca setelah
    // gerakannya benar-benar berhenti.
    jedaGulir.current = window.setTimeout(() => {
      const el = wadah.current
      if (!el) return
      const i = Math.max(0, Math.min(pilihan.length - 1, Math.round(el.scrollTop / TINGGI_BARIS)))
      setSedangGulir(false)
      if (pilihan[i] && pilihan[i].nilai !== terpilih) onPilih(pilihan[i].nilai)
    }, 140)
  }

  const padaTombol = (e: React.KeyboardEvent) => {
    const arah = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!arah) return
    e.preventDefault()
    const i = Math.max(0, Math.min(pilihan.length - 1, indeks + arah))
    if (pilihan[i]) onPilih(pilihan[i].nilai)
  }

  const terpilihTeks = pilihan.find((p) => p.nilai === terpilih)?.teks ?? ''

  return (
    <div className="roda-kolom">
      <span className="roda-nama">{namaKolom}</span>
      <div
        className="roda-gulir"
        ref={wadah}
        onScroll={padaGulir}
        onKeyDown={padaTombol}
        tabIndex={0}
        role="spinbutton"
        aria-label={namaKolom}
        aria-valuenow={terpilih}
        aria-valuetext={terpilihTeks}
      >
        <div className="roda-jarak" aria-hidden="true" />
        {pilihan.map((p) => (
          <div
            key={p.nilai}
            className="roda-baris"
            data-terpilih={p.nilai === terpilih ? 'ya' : 'tidak'}
            onClick={() => onPilih(p.nilai)}
          >
            {p.teks}
          </div>
        ))}
        <div className="roda-jarak" aria-hidden="true" />
      </div>
    </div>
  )
}
