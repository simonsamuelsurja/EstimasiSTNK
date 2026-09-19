/**
 * Pemilih kecamatan.
 *
 * 140 kecamatan terlalu banyak untuk dropdown biasa, jadi dipakai pencarian
 * ketik-dan-saring. Nama Samsat ikut ditampilkan supaya staf langsung tahu
 * ke mana kecamatan itu bermuara tanpa perlu membuka daftar terpisah.
 *
 * Beberapa nama kecamatan dipakai lebih dari satu daerah — "Curug" ada di
 * Kelapa Dua, Depok, dan Cinere. Karena itu yang dikembalikan bukan cuma nama,
 * melainkan pasangan kecamatan dan Samsat-nya.
 */

import { useMemo, useState } from 'react'
import { daftarKecamatan, KECAMATAN_LAINNYA } from '../core/data'
import { Lembar } from './dasar'

const terurut = [...daftarKecamatan].sort(
  (a, b) => a.kecamatan.localeCompare(b.kecamatan, 'id') || a.samsat.localeCompare(b.samsat, 'id'),
)

/** Nama kecamatan yang dipakai lebih dari satu Samsat. */
const namaGanda = new Set(
  Object.entries(
    terurut.reduce<Record<string, number>>((hitung, k) => {
      hitung[k.kecamatan] = (hitung[k.kecamatan] ?? 0) + 1
      return hitung
    }, {}),
  )
    .filter(([, n]) => n > 1)
    .map(([nama]) => nama),
)

export function PilihDaerah({
  label,
  kecamatan,
  samsat,
  onUbah,
}: {
  label: string
  kecamatan: string
  samsat?: string
  onUbah: (kecamatan: string, samsat?: string) => void
}) {
  const [terbuka, setTerbuka] = useState(false)
  const [cari, setCari] = useState('')

  const hasil = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    if (!kunci) return terurut
    return terurut.filter(
      (k) => k.kecamatan.toLowerCase().includes(kunci) || k.samsat.toLowerCase().includes(kunci),
    )
  }, [cari])

  const tampilSamsat = kecamatan && kecamatan !== KECAMATAN_LAINNYA ? samsat : undefined

  return (
    <>
      <button
        type="button"
        className="pemicu-pilih"
        data-kosong={kecamatan ? 'tidak' : 'ya'}
        onClick={() => {
          setCari('')
          setTerbuka(true)
        }}
        aria-label={label}
      >
        <span>{kecamatan || 'Pilih kecamatan'}</span>
        {tampilSamsat && <span className="samsat">Samsat {tampilSamsat}</span>}
      </button>

      {terbuka && (
        <Lembar judul={label} onTutup={() => setTerbuka(false)}>
          <div className="pencarian">
            <input
              type="text"
              autoFocus
              placeholder="Ketik nama kecamatan atau Samsat"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              aria-label="Cari kecamatan"
            />
          </div>

          <ul className="daftar-pilihan">
            <li>
              <button
                type="button"
                onClick={() => {
                  onUbah(KECAMATAN_LAINNYA, undefined)
                  setTerbuka(false)
                }}
              >
                <span>{KECAMATAN_LAINNYA}</span>
                <span className="samsat">di luar daftar</span>
              </button>
            </li>
            {hasil.map((k) => (
              <li key={`${k.kecamatan}|${k.samsat}`}>
                <button
                  type="button"
                  onClick={() => {
                    onUbah(k.kecamatan, k.samsat)
                    setTerbuka(false)
                  }}
                >
                  <span>
                    {k.kecamatan}
                    {namaGanda.has(k.kecamatan) && (
                      <span className="petunjuk"> · ada di beberapa daerah</span>
                    )}
                  </span>
                  <span className="samsat">{k.samsat}</span>
                </button>
              </li>
            ))}
          </ul>

          {hasil.length === 0 && (
            <p className="kosong">Tidak ada kecamatan yang cocok dengan “{cari.trim()}”.</p>
          )}
        </Lembar>
      )}
    </>
  )
}
