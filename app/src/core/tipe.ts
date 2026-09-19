/**
 * Tipe data inti kalkulator estimasi.
 *
 * Semua istilah memakai bahasa yang dipakai sehari-hari di Surya Jasa,
 * bukan terjemahan teknis, supaya mudah dicocokkan dengan Excel asal.
 */

export const JENIS_JASA = [
  'BBN',
  'Mutasi',
  'Perpanjang',
  'Perpanjang ACC KTP',
  'Pindah Alamat',
  'STNK Hilang',
  'Revisi Nopol Ganti Buku',
  'Revisi Nopol Tidak Ganti Buku',
] as const
export type JenisJasa = (typeof JENIS_JASA)[number]

export const JENIS_KENDARAAN = ['Mobil', 'Motor', 'Pickup'] as const
export type JenisKendaraan = (typeof JENIS_KENDARAAN)[number]

export const PILIHAN_NOPOL = [
  'Tidak',
  'Ganjil/Genap',
  '3 Angka Ada Huruf',
  '2 Angka Ada Huruf',
  '1 Angka Ada Huruf',
] as const
export type PilihanNopol = (typeof PILIHAN_NOPOL)[number]

/** Jasa yang memerlukan dua lokasi (asal dan tujuan). */
export const JASA_DUA_LOKASI: JenisJasa[] = ['BBN', 'Mutasi', 'Pindah Alamat']

/** Jasa revisi nopol, yang aturannya menyimpang dari jasa lain. */
export const JASA_REVISI: JenisJasa[] = [
  'Revisi Nopol Ganti Buku',
  'Revisi Nopol Tidak Ganti Buku',
]

/** Jasa perpanjangan, yang harganya dicari per Samsat, bukan per rute. */
export const JASA_PERPANJANG: JenisJasa[] = ['Perpanjang', 'Perpanjang ACC KTP']

// ---------------------------------------------------------------------------
// Masukan
// ---------------------------------------------------------------------------

export interface InputEstimasi {
  nopol: string
  /** Tanggal jatuh tempo STNK, format ISO `yyyy-mm-dd`. */
  tanggalStnk: string
  jasa: JenisJasa
  kendaraan: JenisKendaraan

  /** Kecamatan asal. Diterjemahkan jadi Samsat lewat tabel daerah. */
  kecamatanAsal: string
  /** Kecamatan tujuan. Hanya dipakai jasa yang butuh dua lokasi. */
  kecamatanTujuan: string

  /**
   * Samsat yang dipilih langsung oleh staf.
   *
   * Ada nama kecamatan yang dipakai beberapa daerah sekaligus — "Curug"
   * misalnya ada di Kelapa Dua, Depok, dan Cinere. Excel selalu mengambil yang
   * pertama, sehingga dua sisanya tidak pernah bisa terpilih. Di sini pilihan
   * staf yang menentukan, dan pencarian berdasarkan nama hanya jadi cadangan.
   */
  samsatAsalPilihan?: string
  samsatTujuanPilihan?: string

  gantiKaleng: boolean
  pkb: number
  swdkllj: number

  /** Menambahkan biaya jasa STNK hilang walau jenis jasanya bukan itu. */
  stnkHilang: boolean
  pengurusanJauh: boolean
  etle: boolean

  matikanNopol: boolean
  requestNopol: PilihanNopol

  // Biaya dinas luar kota, hanya dipakai bila `pengurusanJauh` aktif.
  jarak: number
  hotel: number
  tolTaksi: number
  makan: number
  tiketPesawat: number
  lokasiJauhAsal: string
  lokasiJauhTujuan: string

  /**
   * Tanggal acuan penghitungan keterlambatan.
   * Kosong berarti hari ini. Diisi hanya oleh pengujian.
   */
  tanggalAcuan?: string
}

// ---------------------------------------------------------------------------
// Keluaran
// ---------------------------------------------------------------------------

export interface BarisBiaya {
  /** Kode tetap, dipakai mode manual untuk menandai baris yang ditimpa. */
  kode: string
  label: string
  nilai: number
  /** Penjelasan singkat asal angka, ditampilkan saat baris dibuka. */
  rincian?: string
}

export interface KelompokBiaya {
  kode: string
  judul: string
  baris: BarisBiaya[]
  subtotal: number
}

export type TingkatPeringatan = 'info' | 'perhatian' | 'gagal'

export interface Peringatan {
  tingkat: TingkatPeringatan
  pesan: string
}

export interface HasilEstimasi {
  /** Judul estimasi, mis. "Mutasi Cianjur - Jakarta". */
  judul: string
  nopol: string
  tanggalStnk: string

  samsatAsal: string | null
  samsatTujuan: string | null
  jadetabek: boolean

  bulanTelat: number
  tahunJr: number

  kelompok: KelompokBiaya[]
  total: number
  peringatan: Peringatan[]
}

// ---------------------------------------------------------------------------
// Mode manual
// ---------------------------------------------------------------------------

/**
 * Penyesuaian manual untuk satu baris biaya.
 *
 * Label dan nilai sama-sama bisa diubah: kadang yang perlu disesuaikan
 * bukan angkanya, melainkan sebutannya di mata klien.
 */
export interface PenyesuaianManual {
  kode: string
  /** Label pengganti. Kosong berarti pakai label asli. */
  label?: string
  /** Nilai pengganti. Kosong berarti pakai nilai hasil hitungan. */
  nilai?: number
}

export interface HasilDenganPenyesuaian extends HasilEstimasi {
  /** Kode baris yang nilainya ditimpa manual. */
  kodeDitimpa: string[]
  /** Total sebelum penyesuaian manual, untuk pembanding. */
  totalAsli: number
}
