/**
 * Pemuat data referensi dan pembuat indeks pencarian.
 *
 * Data disimpan sebagai JSON datar supaya mudah dibaca manusia, mudah dibanding
 * saat ada perubahan, dan mudah diekspor. Indeks dibangun sekali di sini.
 */

import kecamatanJson from '../data/kecamatan.json'
import samsatJson from '../data/samsat.json'
import ruteJson from '../data/rute.json'
import perpanjangJson from '../data/perpanjang.json'
import perpanjangAccJson from '../data/perpanjang-acc.json'
import catatanJauhJson from '../data/catatan-jasa-jauh.json'

export interface BarisKecamatan {
  kecamatan: string
  samsat: string
}

export interface BarisSamsat {
  samsat: string
  jabodetabek: boolean
}

export interface BarisRute {
  dari: string
  ke: string
  bbnMobil: number | null
  bbnMotor: number | null
  pindahMobil: number | null
  pindahMotor: number | null
}

export interface BarisPerpanjang {
  kendaraan: string
  samsat: string
  harga: number
}

export interface BarisPerpanjangAcc {
  kendaraan: string
  limaTahun: boolean
  samsat: string
  harga: number
}

/**
 * Rincian jasa luar kota per tujuan.
 * CATATAN: belum dipakai perhitungan. Logikanya belum ditetapkan pemilik,
 * jadi jasa luar kota memakai tarif tunggal `jauh.jasa`.
 */
export interface BarisCatatanJauh {
  asal: string
  tujuan: string
  jasa: number | null
  akomodasi: number | null
}

export const daftarKecamatan = kecamatanJson as BarisKecamatan[]
export const daftarSamsat = samsatJson as BarisSamsat[]
export const daftarRute = ruteJson as BarisRute[]
export const daftarPerpanjang = perpanjangJson as BarisPerpanjang[]
export const daftarPerpanjangAcc = perpanjangAccJson as BarisPerpanjangAcc[]
export const catatanJasaJauh = catatanJauhJson as BarisCatatanJauh[]

/** Pilihan khusus untuk daerah yang tidak ada di daftar. */
export const KECAMATAN_LAINNYA = 'Lainnya'

// ---------------------------------------------------------------------------
// Indeks pencarian
// ---------------------------------------------------------------------------

const kunci = (s: string) => s.trim().toLowerCase()

const indeksKecamatan = new Map(daftarKecamatan.map((k) => [kunci(k.kecamatan), k.samsat]))
const indeksSamsat = new Map(daftarSamsat.map((s) => [kunci(s.samsat), s.jabodetabek]))

/** Menerjemahkan nama kecamatan jadi Samsat. `null` bila tidak terdaftar. */
export function samsatDariKecamatan(kecamatan: string): string | null {
  if (!kecamatan) return null
  return indeksKecamatan.get(kunci(kecamatan)) ?? null
}

/** `null` bila Samsat tidak terdaftar, supaya bisa dibedakan dari "bukan Jadetabek". */
export function samsatJabodetabek(samsat: string | null): boolean | null {
  if (!samsat) return null
  return indeksSamsat.get(kunci(samsat)) ?? null
}

const indeksRute = new Map(daftarRute.map((r) => [`${kunci(r.dari)}→${kunci(r.ke)}`, r]))

/** Mencari rute satu arah saja, seperti lookup BBN di Excel. */
export function cariRuteSearah(dari: string, ke: string): BarisRute | null {
  return indeksRute.get(`${kunci(dari)}→${kunci(ke)}`) ?? null
}

/** Mencari rute dua arah, seperti lookup Mutasi dan Pindah Alamat di Excel. */
export function cariRuteDuaArah(dari: string, ke: string): BarisRute | null {
  return cariRuteSearah(dari, ke) ?? cariRuteSearah(ke, dari)
}

const indeksPerpanjang = new Map(
  daftarPerpanjang.map((p) => [`${kunci(p.kendaraan)}|${kunci(p.samsat)}`, p.harga]),
)

export function cariHargaPerpanjang(kendaraan: string, samsat: string): number | null {
  return indeksPerpanjang.get(`${kunci(kendaraan)}|${kunci(samsat)}`) ?? null
}

const indeksPerpanjangAcc = new Map(
  daftarPerpanjangAcc.map((p) => [
    `${kunci(p.kendaraan)}|${p.limaTahun}|${kunci(p.samsat)}`,
    p.harga,
  ]),
)

export function cariHargaPerpanjangAcc(
  kendaraan: string,
  limaTahun: boolean,
  samsat: string,
): number | null {
  return indeksPerpanjangAcc.get(`${kunci(kendaraan)}|${limaTahun}|${kunci(samsat)}`) ?? null
}

// ---------------------------------------------------------------------------
// Bantuan untuk tampilan
// ---------------------------------------------------------------------------

/** Nama kecamatan terurut, untuk kotak pencarian. */
export const namaKecamatanTerurut: string[] = [
  KECAMATAN_LAINNYA,
  ...daftarKecamatan.map((k) => k.kecamatan).sort((a, b) => a.localeCompare(b, 'id')),
]

/** Samsat yang punya harga rute. Yang lain tidak bisa dipakai jasa antar daerah. */
export const samsatPunyaRute = new Set<string>([
  ...daftarRute.map((r) => kunci(r.dari)),
  ...daftarRute.map((r) => kunci(r.ke)),
])

export function samsatPunyaHargaRute(samsat: string | null): boolean {
  return samsat ? samsatPunyaRute.has(kunci(samsat)) : false
}
