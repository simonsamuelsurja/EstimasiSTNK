/** Komponen dasar yang dipakai berulang di seluruh tampilan. */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { angkaRupiah, bacaAngka } from './format'

// --------------------------------------------------------------------- kartu

export function Kartu({
  judul,
  aksi,
  children,
}: {
  judul?: string
  aksi?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="kartu">
      {judul && (
        <div className="kartu-judul">
          <span>{judul}</span>
          {aksi}
        </div>
      )}
      <div className="kartu-isi">{children}</div>
    </section>
  )
}

// -------------------------------------------------------------------- isian

export function BarisIsian({
  label,
  petunjuk,
  children,
}: {
  label: string
  petunjuk?: string
  children: ReactNode
}) {
  return (
    <div className="baris-isian">
      <span className="label-isian">{label}</span>
      {children}
      {petunjuk && <span className="petunjuk">{petunjuk}</span>}
    </div>
  )
}

/** Isian rupiah dengan pemisah ribuan yang ikut berjalan saat diketik. */
export function IsianRupiah({
  nilai,
  onUbah,
  ariaLabel,
}: {
  nilai: number
  onUbah: (n: number) => void
  ariaLabel: string
}) {
  const [teks, setTeks] = useState(nilai ? angkaRupiah(nilai) : '')

  useEffect(() => {
    // Menyelaraskan bila nilai diubah dari luar, tanpa mengganggu pengetikan.
    if (bacaAngka(teks) !== nilai) setTeks(nilai ? angkaRupiah(nilai) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nilai])

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      placeholder="0"
      value={teks}
      onChange={(e) => {
        const n = bacaAngka(e.target.value)
        setTeks(n ? angkaRupiah(n) : '')
        onUbah(n)
      }}
    />
  )
}

/** Pilihan berjajar, untuk daftar pendek yang sering dipakai. */
export function Segmen<T extends string>({
  pilihan,
  nilai,
  onUbah,
  ariaLabel,
}: {
  pilihan: readonly T[]
  nilai: T
  onUbah: (n: T) => void
  ariaLabel: string
}) {
  return (
    <div className="segmen" role="group" aria-label={ariaLabel}>
      {pilihan.map((p) => (
        <button key={p} type="button" aria-pressed={nilai === p} onClick={() => onUbah(p)}>
          {p}
        </button>
      ))}
    </div>
  )
}

export function Sakelar({
  label,
  nilai,
  onUbah,
}: {
  label: string
  nilai: boolean
  onUbah: (n: boolean) => void
}) {
  const id = useId()
  return (
    <div className="sakelar" onClick={() => onUbah(!nilai)}>
      <span className="sakelar-teks" id={id}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={nilai}
        aria-labelledby={id}
        className="sakelar-tuas"
        onClick={(e) => {
          e.stopPropagation()
          onUbah(!nilai)
        }}
      />
    </div>
  )
}

// ----------------------------------------------------------------- lembaran

/** Panel yang muncul dari bawah di HP, jadi kotak tengah di layar besar. */
export function Lembar({
  judul,
  onTutup,
  kaki,
  children,
}: {
  judul: string
  onTutup: () => void
  kaki?: ReactNode
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const padaTombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup()
    }
    document.addEventListener('keydown', padaTombol)
    const semulaOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', padaTombol)
      document.body.style.overflow = semulaOverflow
    }
  }, [onTutup])

  return (
    <div
      className="tirai"
      onMouseDown={(e) => {
        if (!panel.current?.contains(e.target as Node)) onTutup()
      }}
    >
      <div className="lembar" ref={panel} role="dialog" aria-modal="true" aria-label={judul}>
        <div className="lembar-kepala">
          <h2>{judul}</h2>
          <button type="button" className="tutup" onClick={onTutup} aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="lembar-isi">{children}</div>
        {kaki && <div className="lembar-kaki">{kaki}</div>}
      </div>
    </div>
  )
}

// --------------------------------------------------------------- peringatan

export function Peringatan({
  tingkat,
  children,
}: {
  tingkat: 'info' | 'perhatian' | 'gagal'
  children: ReactNode
}) {
  return <div className={`peringatan peringatan-${tingkat}`}>{children}</div>
}
