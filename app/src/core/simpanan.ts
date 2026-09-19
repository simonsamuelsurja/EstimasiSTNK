/**
 * Simpanan isian daftar harga.
 *
 * Selama aplikasi belum punya server, apa yang diisi di halaman daftar harga
 * tersimpan di peramban perangkat ini saja. Itu cukup untuk mengisi sambil
 * berpikir, tapi TIDAK cukup untuk jadi sumber kebenaran: isinya tidak ikut
 * berpindah ke HP lain dan bisa hilang kalau data peramban dibersihkan.
 *
 * Karena itu halaman daftar harga selalu menyediakan ekspor. Berkas hasil
 * ekspor itulah yang dimasukkan ke data aplikasi supaya jadi permanen dan
 * dipakai semua orang.
 */

import { daftarRute, pasangRute, type BarisRute } from './data'
import { TARIF_BAWAAN, type Tarif } from './tarif'

const KUNCI = 'estimasi-stnk.daftar-harga'

export interface IsianHarga {
  /** Tarif yang diubah, dipetakan dari kode tarif ke nilai barunya. */
  tarif: Record<string, number>
  /** Baris rute yang ditambahkan atau diubah. */
  rute: BarisRute[]
  diubahPada?: string
}

export const ISIAN_KOSONG: IsianHarga = { tarif: {}, rute: [] }

export function muatIsian(): IsianHarga {
  try {
    const tersimpan = localStorage.getItem(KUNCI)
    if (!tersimpan) return ISIAN_KOSONG
    const isi = JSON.parse(tersimpan) as Partial<IsianHarga>
    return {
      tarif: isi.tarif ?? {},
      rute: Array.isArray(isi.rute) ? isi.rute : [],
      diubahPada: isi.diubahPada,
    }
  } catch {
    // Penyimpanan peramban bisa ditolak atau berisi data rusak.
    // Aplikasi tetap jalan dengan harga bawaan.
    return ISIAN_KOSONG
  }
}

export function simpanIsian(isian: IsianHarga): IsianHarga {
  const denganWaktu = { ...isian, diubahPada: new Date().toISOString() }
  try {
    localStorage.setItem(KUNCI, JSON.stringify(denganWaktu))
  } catch {
    // Diabaikan dengan sengaja: gagal menyimpan tidak boleh menghentikan kerja.
  }
  return denganWaktu
}

export function hapusIsian(): void {
  try {
    localStorage.removeItem(KUNCI)
  } catch {
    // Diabaikan dengan sengaja.
  }
}

// ---------------------------------------------------------------------------
// Penggabungan dengan data bawaan
// ---------------------------------------------------------------------------

const kunciRute = (r: BarisRute) => `${r.dari.trim().toLowerCase()}→${r.ke.trim().toLowerCase()}`

/** Rute bawaan ditimpa dan ditambah oleh isian pengguna. */
export function ruteGabungan(isian: IsianHarga): BarisRute[] {
  const peta = new Map(daftarRute.map((r) => [kunciRute(r), r]))
  for (const r of isian.rute) peta.set(kunciRute(r), r)
  return [...peta.values()]
}

export function tarifGabungan(isian: IsianHarga): Tarif[] {
  return TARIF_BAWAAN.map((t) =>
    isian.tarif[t.kode] !== undefined ? { ...t, nilai: isian.tarif[t.kode] } : t,
  )
}

/** Memberlakukan isian ke seluruh aplikasi. */
export function terapkanIsian(isian: IsianHarga): void {
  pasangRute(ruteGabungan(isian))
}

/** Baris rute yang benar-benar sudah terisi lengkap, untuk dihitung sebagai kemajuan. */
export function ruteTerisiPenuh(rute: BarisRute[]): BarisRute[] {
  return rute.filter(
    (r) =>
      r.bbnMobil !== null && r.bbnMotor !== null && r.pindahMobil !== null && r.pindahMotor !== null,
  )
}
