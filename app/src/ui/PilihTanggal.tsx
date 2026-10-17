/**
 * Pemilih tanggal tiga dropdown: tanggal, bulan, tahun.
 *
 * Yang tampil hanya tanggal terpilih, supaya formulir tetap ringkas. Daftar
 * pilihan tampil sebagai panel kecil di dekat kolom, termasuk di HP.
 * Tidak memakai select bawaan yang dapat membuka pemilih satu layar penuh.
 */

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

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
      <DropdownTanggal
        label="Tanggal"
        nilai={hari}
        pilihan={daftarHari.map((h) => ({ nilai: h, teks: String(h) }))}
        onUbah={(h) => ubah(tahun, bulan, h)}
      />
      <DropdownTanggal
        label="Bulan"
        nilai={bulan}
        pilihan={NAMA_BULAN.map((teks, i) => ({ nilai: i + 1, teks }))}
        onUbah={(b) => ubah(tahun, b, hari)}
      />
      <DropdownTanggal
        label="Tahun"
        nilai={tahun}
        pilihan={(DAFTAR_TAHUN.includes(tahun) ? DAFTAR_TAHUN : [tahun, ...DAFTAR_TAHUN])
          .map((t) => ({ nilai: t, teks: String(t) }))}
        onUbah={(t) => ubah(t, bulan, hari)}
      />
    </div>
  )
}


interface PilihanTanggal {
  nilai: number
  teks: string
}

/** Daftar dibatasi tingginya dan dipasang di body agar tidak terpotong kartu. */
function DropdownTanggal({ label, nilai, pilihan, onUbah }: {
  label: string
  nilai: number
  pilihan: PilihanTanggal[]
  onUbah: (nilai: number) => void
}) {
  const id = useId()
  const tombol = useRef<HTMLButtonElement>(null)
  const daftar = useRef<HTMLUListElement>(null)
  const [terbuka, setTerbuka] = useState(false)
  const [aktif, setAktif] = useState(0)
  const [posisi, setPosisi] = useState<CSSProperties>({})
  const terpilih = Math.max(0, pilihan.findIndex((p) => p.nilai === nilai))

  const buka = () => {
    const kotak = tombol.current!.getBoundingClientRect()
    const viewport = window.visualViewport
    const tinggi = viewport?.height ?? window.innerHeight
    const atas = viewport?.offsetTop ?? 0
    const tinggiDaftar = Math.min(220, tinggi * 0.35, pilihan.length * 40 + 8)
    const keAtas = atas + tinggi - kotak.bottom < tinggiDaftar + 8 && kotak.top - atas > tinggiDaftar
    setPosisi({
      left: kotak.left,
      top: keAtas ? kotak.top - tinggiDaftar - 4 : kotak.bottom + 4,
      minWidth: kotak.width,
      maxHeight: tinggiDaftar,
    })
    setAktif(terpilih)
    setTerbuka(true)
  }

  useEffect(() => {
    if (!terbuka) return
    const diLuar = (e: PointerEvent) => {
      if (!tombol.current?.contains(e.target as Node) && !daftar.current?.contains(e.target as Node)) {
        setTerbuka(false)
      }
    }
    const tutup = () => setTerbuka(false)
    document.addEventListener('pointerdown', diLuar)
    window.addEventListener('resize', tutup)
    window.addEventListener('scroll', tutup)
    window.visualViewport?.addEventListener('resize', tutup)
    return () => {
      document.removeEventListener('pointerdown', diLuar)
      window.removeEventListener('resize', tutup)
      window.removeEventListener('scroll', tutup)
      window.visualViewport?.removeEventListener('resize', tutup)
    }
  }, [terbuka])

  useEffect(() => {
    if (!terbuka || !daftar.current) return
    const baris = daftar.current.children[aktif] as HTMLElement | undefined
    if (baris) daftar.current.scrollTop = baris.offsetTop - (daftar.current.clientHeight - baris.offsetHeight) / 2
  }, [terbuka, aktif])

  const pilih = (indeks: number) => {
    onUbah(pilihan[indeks].nilai)
    setTerbuka(false)
    tombol.current?.focus({ preventScroll: true })
  }

  return (
    <>
      <button
        ref={tombol}
        type="button"
        className="tanggal-pemicu"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        aria-controls={terbuka ? id : undefined}
        aria-activedescendant={terbuka ? `${id}-${aktif}` : undefined}
        onClick={() => terbuka ? setTerbuka(false) : buka()}
        onBlur={() => setTerbuka(false)}
        onKeyDown={(e) => {
          if (e.key === 'Tab') { setTerbuka(false); return }
          if (e.key === 'Escape') { e.preventDefault(); setTerbuka(false); return }
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
            e.preventDefault()
            if (!terbuka) { buka(); return }
            setAktif(e.key === 'Home' ? 0 : e.key === 'End' ? pilihan.length - 1 :
              Math.max(0, Math.min(pilihan.length - 1, aktif + (e.key === 'ArrowDown' ? 1 : -1))))
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (terbuka) pilih(aktif)
            else buka()
          }
        }}
      >
        {pilihan[terpilih].teks}
      </button>
      {terbuka && createPortal(
        <ul ref={daftar} id={id} role="listbox" aria-label={label} className="tanggal-daftar" style={posisi}>
          {pilihan.map((p, i) => (
            <li
              key={p.nilai}
              id={`${id}-${i}`}
              role="option"
              aria-selected={p.nilai === nilai}
              data-aktif={i === aktif}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pilih(i)}
            >
              {p.teks}
            </li>
          ))}
        </ul>, document.body,
      )}
    </>
  )
}
