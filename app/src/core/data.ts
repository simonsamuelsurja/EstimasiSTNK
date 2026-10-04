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
import hargaKhususJson from '../data/harga-khusus-jakarta.json'

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

/**
 * Harga khusus Mutasi dari/ke Jakarta dan BBN di wilayah tertentu.
 *
 * Untuk kombinasi yang terdaftar di sini, jasa dan penulisan BPKB memakai
 * angka tabel ini, dan ada tambahan biaya proses. Kombinasi yang tidak
 * terdaftar tetap memakai tabel rute dan tarif penulisan biasa.
 */
export interface BarisHargaKhusus {
  layanan: 'BBN' | 'Mutasi'
  kendaraan: 'Mobil' | 'Motor'
  /** Wilayah selain Jakarta. Untuk Mutasi, pasangannya selalu Jakarta. */
  wilayah: string
  biayaProses: number
  jasa: number
  penulisanBpkb: number
}

export const daftarKecamatan = kecamatanJson as BarisKecamatan[]
export const daftarSamsat = samsatJson as BarisSamsat[]
export const daftarRute = ruteJson as BarisRute[]
export const daftarPerpanjang = perpanjangJson as BarisPerpanjang[]
export const daftarPerpanjangAcc = perpanjangAccJson as BarisPerpanjangAcc[]
export const catatanJasaJauh = catatanJauhJson as BarisCatatanJauh[]
export const daftarHargaKhusus = hargaKhususJson as BarisHargaKhusus[]

/** Pilihan khusus untuk daerah yang tidak ada di daftar. */
export const KECAMATAN_LAINNYA = 'Lainnya'

// ---------------------------------------------------------------------------
// Indeks pencarian
// ---------------------------------------------------------------------------

const kunci = (s: string) => s.trim().toLowerCase()

/**
 * Nama kecamatan bisa dipakai beberapa daerah sekaligus — "Curug" ada di
 * Kelapa Dua, Depok, dan Cinere. Yang PERTAMA yang menang, meniru VLOOKUP di
 * Excel yang berhenti pada kecocokan pertama. Ini hanya jalan cadangan:
 * kalau staf memilih Samsat langsung lewat daftar, pilihannya yang dipakai.
 */
const indeksKecamatan = new Map<string, string>()
for (const k of daftarKecamatan) {
  const kc = kunci(k.kecamatan)
  if (!indeksKecamatan.has(kc)) indeksKecamatan.set(kc, k.samsat)
}
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

/**
 * Rute yang berlaku: bawaan ditambah yang diisi lewat halaman daftar harga.
 * Sengaja bisa diganti saat aplikasi berjalan supaya harga yang baru diisi
 * langsung dipakai kalkulator, tanpa perlu memuat ulang halaman.
 */
let ruteBerlaku: BarisRute[] = daftarRute
let indeksRute = new Map<string, BarisRute>()

function susunIndeksRute() {
  indeksRute = new Map()
  for (const r of ruteBerlaku) {
    const k = `${kunci(r.dari)}→${kunci(r.ke)}`
    // Baris yang ditambahkan belakangan menimpa bawaan dengan kunci sama.
    indeksRute.set(k, r)
  }
}
susunIndeksRute()

/** Mengganti seluruh rute yang berlaku. Dipanggil saat simpanan dimuat atau diubah. */
export function pasangRute(rute: BarisRute[]): void {
  ruteBerlaku = rute
  susunIndeksRute()
}

/** Rute yang sedang berlaku, termasuk isian pengguna. */
export function ruteYangBerlaku(): BarisRute[] {
  return ruteBerlaku
}

/** Mencari rute satu arah saja, seperti lookup BBN di Excel. */
export function cariRuteSearah(dari: string, ke: string): BarisRute | null {
  return indeksRute.get(`${kunci(dari)}→${kunci(ke)}`) ?? null
}

/** Mencari rute dua arah, seperti lookup Mutasi dan Pindah Alamat di Excel. */
export function cariRuteDuaArah(dari: string, ke: string): BarisRute | null {
  return cariRuteSearah(dari, ke) ?? cariRuteSearah(ke, dari)
}

/** Samsat yang menjadi pasangan harga khusus Mutasi. */
export const SAMSAT_JAKARTA = 'Jakarta'

const indeksHargaKhusus = new Map(
  daftarHargaKhusus.map((h) => [
    `${kunci(h.layanan)}|${kunci(h.kendaraan)}|${kunci(h.wilayah)}`,
    h,
  ]),
)

/**
 * Mencari harga khusus.
 *
 * Mutasi berlaku dua arah: dari wilayah ke Jakarta maupun sebaliknya.
 * BBN berlaku untuk wilayah itu sendiri, karena BBN tidak berpindah wilayah.
 */
export function cariHargaKhusus(
  layanan: string,
  kendaraan: 'Mobil' | 'Motor',
  samsatAsal: string | null,
  samsatTujuan: string | null,
): BarisHargaKhusus | null {
  if (!samsatAsal || !samsatTujuan) return null
  const asal = kunci(samsatAsal)
  const tujuan = kunci(samsatTujuan)
  let wilayah: string | null = null
  if (layanan === 'Mutasi') {
    const jakarta = kunci(SAMSAT_JAKARTA)
    if (asal === jakarta && tujuan !== jakarta) wilayah = tujuan
    else if (tujuan === jakarta && asal !== jakarta) wilayah = asal
  } else if (layanan === 'BBN' && asal === tujuan) {
    wilayah = asal
  }
  if (!wilayah) return null
  return indeksHargaKhusus.get(`${kunci(layanan)}|${kunci(kendaraan)}|${wilayah}`) ?? null
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

export function samsatPunyaHargaRute(samsat: string | null): boolean {
  if (!samsat) return false
  const k = kunci(samsat)
  return ruteBerlaku.some((r) => kunci(r.dari) === k || kunci(r.ke) === k)
}
