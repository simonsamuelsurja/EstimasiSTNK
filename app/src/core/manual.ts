/**
 * Mode manual.
 *
 * Pengganti sheet `Hitung Manual` di Excel, yang selnya sengaja tidak dikunci
 * supaya angka bisa disesuaikan per klien. Di sini penyesuaian itu jadi lapisan
 * tersendiri: hasil hitungan asli tetap utuh dan bisa dikembalikan kapan saja.
 *
 * Label ikut bisa diubah, karena kadang yang perlu disesuaikan bukan angkanya
 * melainkan sebutannya di mata klien.
 */

import { hitungKertasGesek } from './hitung'
import type { PetaTarif } from './tarif'
import { petaTarif } from './tarif'
import type {
  BarisBiaya,
  HasilDenganPenyesuaian,
  HasilEstimasi,
  KelompokBiaya,
  PenyesuaianManual,
} from './tipe'

/**
 * Baris yang nilainya ikut berubah ketika baris lain ditimpa.
 *
 * Kertas gesek mengikuti besaran cek fisik, jadi menimpa cek fisik harus ikut
 * menyesuaikan kertas gesek — kecuali kertas gesek itu sendiri sudah ditimpa.
 */
const BARIS_TURUNAN: Record<string, { dari: string; hitung: (nilai: number, t: PetaTarif) => number }> = {
  kertasGesek: { dari: 'cekFisik', hitung: hitungKertasGesek },
}

export function terapkanPenyesuaian(
  hasil: HasilEstimasi,
  penyesuaian: PenyesuaianManual[],
  tarif: PetaTarif = petaTarif(),
): HasilDenganPenyesuaian {
  const peta = new Map(penyesuaian.map((p) => [p.kode, p]))
  const kodeDitimpa: string[] = []

  // Nilai yang berlaku setelah penyesuaian, dipakai baris turunan.
  const nilaiBerlaku = new Map<string, number>()
  for (const kelompok of hasil.kelompok) {
    for (const baris of kelompok.baris) {
      const ubah = peta.get(baris.kode)
      nilaiBerlaku.set(baris.kode, ubah?.nilai ?? baris.nilai)
    }
  }

  const kelompokBaru: KelompokBiaya[] = hasil.kelompok.map((kelompok) => {
    const baris: BarisBiaya[] = kelompok.baris.map((asli) => {
      const ubah = peta.get(asli.kode)
      const turunan = BARIS_TURUNAN[asli.kode]

      let nilai = asli.nilai
      let rincian = asli.rincian

      if (ubah?.nilai !== undefined) {
        nilai = ubah.nilai
        kodeDitimpa.push(asli.kode)
        rincian = `Disesuaikan manual dari ${formatRupiah(asli.nilai)}`
      } else if (turunan && peta.get(turunan.dari)?.nilai !== undefined) {
        // Induknya ditimpa dan baris ini tidak, jadi ikut menyesuaikan.
        const nilaiInduk = nilaiBerlaku.get(turunan.dari) ?? 0
        nilai = turunan.hitung(nilaiInduk, tarif)
        rincian = 'Menyesuaikan cek fisik yang diubah manual'
      }

      const label = ubah?.label?.trim() ? ubah.label.trim() : asli.label
      return { kode: asli.kode, label, nilai, rincian }
    })

    return { ...kelompok, baris, subtotal: baris.reduce((j, b) => j + b.nilai, 0) }
  })

  const total = Math.round(kelompokBaru.reduce((j, g) => j + g.subtotal, 0) / 1000) * 1000

  return {
    ...hasil,
    kelompok: kelompokBaru,
    total,
    totalAsli: hasil.total,
    kodeDitimpa,
  }
}

export function formatRupiah(nilai: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(nilai))
}

/** Membuang penyesuaian yang tidak mengubah apa pun, supaya tidak menumpuk. */
export function rapikanPenyesuaian(
  hasil: HasilEstimasi,
  penyesuaian: PenyesuaianManual[],
): PenyesuaianManual[] {
  const asli = new Map<string, BarisBiaya>()
  for (const k of hasil.kelompok) for (const b of k.baris) asli.set(b.kode, b)

  return penyesuaian.filter((p) => {
    const dasar = asli.get(p.kode)
    if (!dasar) return false
    const nilaiBeda = p.nilai !== undefined && p.nilai !== dasar.nilai
    const labelBeda = !!p.label?.trim() && p.label.trim() !== dasar.label
    return nilaiBeda || labelBeda
  })
}
