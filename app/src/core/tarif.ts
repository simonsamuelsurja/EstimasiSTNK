/**
 * Tarif dasar.
 *
 * Di Excel, 30 tarif ini tertanam di dalam rumus — mengubah satu tarif berarti
 * membongkar rumus bercabang. Di sini semuanya jadi data: bisa dilihat, diubah
 * lewat halaman admin, dan diekspor.
 *
 * Setiap tarif punya kode tetap yang tidak boleh berubah, karena kode itulah
 * yang dirujuk mesin hitung dan dipakai menandai penyesuaian manual.
 */

export type SatuanTarif = 'rupiah' | 'persen' | 'bulan' | 'angka' | 'rupiah/km'

export interface Tarif {
  kode: string
  kelompok: string
  label: string
  nilai: number
  satuan: SatuanTarif
  catatan?: string
}

export const TARIF_BAWAAN: Tarif[] = [
  // --- Denda keterlambatan --------------------------------------------------
  {
    kode: 'denda.persenSkp',
    kelompok: 'Denda Keterlambatan',
    label: 'Denda SKP per tahun',
    nilai: 48,
    satuan: 'persen',
    catatan: 'Dipakai menghitung SKP per bulan: ((PKB x 48%) + PKB) / 12',
  },
  {
    kode: 'denda.persenPkbPerBulan',
    kelompok: 'Denda Keterlambatan',
    label: 'Denda PKB per bulan',
    nilai: 4,
    satuan: 'persen',
    catatan: 'Hanya dipakai bila keterlambatan di bawah 12 bulan',
  },
  {
    kode: 'denda.marginBulan',
    kelompok: 'Denda Keterlambatan',
    label: 'Margin keterlambatan',
    nilai: 2,
    satuan: 'bulan',
    catatan: 'Ditambahkan ke selisih bulan sebagai cadangan kesalahan',
  },
  {
    kode: 'skp.printPer5Tahun',
    kelompok: 'Denda Keterlambatan',
    label: 'Print SKP per 5 tahun',
    nilai: 100_000,
    satuan: 'rupiah',
  },

  // --- SWDKLLJ & Jasa Raharja ----------------------------------------------
  {
    kode: 'swdkllj.tambahanMobil',
    kelompok: 'Pajak & Penerbitan',
    label: 'Tambahan SWDKLLJ mobil',
    nilai: 100_000,
    satuan: 'rupiah',
    catatan: 'Berlaku juga untuk pickup',
  },
  {
    kode: 'swdkllj.tambahanMotor',
    kelompok: 'Pajak & Penerbitan',
    label: 'Tambahan SWDKLLJ motor',
    nilai: 32_000,
    satuan: 'rupiah',
  },
  {
    kode: 'jr.tambahanPickup',
    kelompok: 'Denda Keterlambatan',
    label: 'Tambahan Jasa Raharja pickup',
    nilai: 72_000,
    satuan: 'rupiah',
    catatan: 'Ditambahkan sekali, bukan dikali jumlah tahun',
  },

  // --- Administrasi STNK & TNKB --------------------------------------------
  {
    kode: 'admStnk.mobil',
    kelompok: 'Pajak & Penerbitan',
    label: 'Administrasi STNK mobil',
    nilai: 200_000,
    satuan: 'rupiah',
    catatan: 'Berlaku juga untuk pickup',
  },
  {
    kode: 'admStnk.motor',
    kelompok: 'Pajak & Penerbitan',
    label: 'Administrasi STNK motor',
    nilai: 100_000,
    satuan: 'rupiah',
  },
  {
    kode: 'tnkb.mobil',
    kelompok: 'Pajak & Penerbitan',
    label: 'TNKB mobil',
    nilai: 100_000,
    satuan: 'rupiah',
    catatan: 'Berlaku juga untuk pickup',
  },
  {
    kode: 'tnkb.motor',
    kelompok: 'Pajak & Penerbitan',
    label: 'TNKB motor',
    nilai: 60_000,
    satuan: 'rupiah',
  },

  // --- Cek fisik & kertas gesek --------------------------------------------
  {
    kode: 'cekFisik.jadetabek',
    kelompok: 'Cek Fisik',
    label: 'Cek fisik dalam Jadetabek',
    nilai: 150_000,
    satuan: 'rupiah',
    catatan: '1 lembar kertas gesek',
  },
  {
    kode: 'cekFisik.luarJadetabek',
    kelompok: 'Cek Fisik',
    label: 'Cek fisik luar Jadetabek',
    nilai: 450_000,
    satuan: 'rupiah',
    catatan: '3 lembar kertas gesek',
  },
  {
    kode: 'cekFisik.stnkHilang',
    kelompok: 'Cek Fisik',
    label: 'Cek fisik STNK hilang',
    nilai: 200_000,
    satuan: 'rupiah',
    catatan: '1 lembar kertas gesek',
  },
  {
    kode: 'cekFisik.revisiPlatB',
    kelompok: 'Cek Fisik',
    label: 'Cek fisik revisi nopol plat B',
    nilai: 100_000,
    satuan: 'rupiah',
    catatan: '1 lembar kertas gesek',
  },
  {
    kode: 'cekFisik.revisiPlatLain',
    kelompok: 'Cek Fisik',
    label: 'Cek fisik revisi nopol plat A / F / D',
    nilai: 150_000,
    satuan: 'rupiah',
    catatan: '1 lembar kertas gesek. Plat A dan F tidak ganti buku tetap 100.000',
  },
  {
    kode: 'kertasGesek.perLembar',
    kelompok: 'Cek Fisik',
    label: 'Kertas gesek per lembar',
    nilai: 15_000,
    satuan: 'rupiah',
  },
  {
    kode: 'kertasGesek.batasSatuLembar',
    kelompok: 'Cek Fisik',
    label: 'Batas cek fisik satu lembar gesek',
    nilai: 200_000,
    satuan: 'rupiah',
    catatan:
      'Cek fisik sampai batas ini butuh satu lembar. Di atasnya dianggap cek fisik luar kota dan butuh lebih banyak lembar',
  },
  {
    kode: 'kertasGesek.lembarLuarKota',
    kelompok: 'Cek Fisik',
    label: 'Lembar gesek cek fisik luar kota',
    nilai: 3,
    satuan: 'angka',
  },

  // --- Buka blokir ----------------------------------------------------------
  {
    kode: 'bukaBlokir.umum',
    kelompok: 'Jasa & Pengurusan',
    label: 'Buka blokir',
    nilai: 150_000,
    satuan: 'rupiah',
  },
  {
    kode: 'bukaBlokir.mutasiJauh',
    kelompok: 'Jasa & Pengurusan',
    label: 'Buka blokir mutasi luar kota',
    nilai: 200_000,
    satuan: 'rupiah',
  },

  // --- Nopol pilihan --------------------------------------------------------
  {
    kode: 'nopol.matikan',
    kelompok: 'Nopol Pilihan',
    label: 'Matikan nopol',
    nilai: 750_000,
    satuan: 'rupiah',
  },
  {
    kode: 'nopol.tnkbGanjilGenap',
    kelompok: 'Nopol Pilihan',
    label: 'TNKB ganjil/genap',
    nilai: 100_000,
    satuan: 'rupiah',
  },
  {
    kode: 'nopol.reqGanjilGenap',
    kelompok: 'Nopol Pilihan',
    label: 'Request nopol ganjil/genap',
    nilai: 3_500_000,
    satuan: 'rupiah',
  },
  {
    kode: 'nopol.admGanjilGenap',
    kelompok: 'Nopol Pilihan',
    label: 'Administrasi nopol ganjil/genap',
    nilai: 2_000_000,
    satuan: 'rupiah',
  },
  {
    kode: 'nopol.admPilihan',
    kelompok: 'Nopol Pilihan',
    label: 'Administrasi nopol pilihan',
    nilai: 3_500_000,
    satuan: 'rupiah',
    catatan: 'Berlaku untuk nopol 1, 2, dan 3 angka',
  },
  {
    kode: 'nopol.req3Angka',
    kelompok: 'Nopol Pilihan',
    label: 'Request nopol 3 angka ada huruf',
    nilai: 7_600_000,
    satuan: 'rupiah',
  },
  {
    kode: 'nopol.req2Angka',
    kelompok: 'Nopol Pilihan',
    label: 'Request nopol 2 angka ada huruf',
    nilai: 10_100_000,
    satuan: 'rupiah',
  },
  {
    kode: 'nopol.req1Angka',
    kelompok: 'Nopol Pilihan',
    label: 'Request nopol 1 angka ada huruf',
    nilai: 15_100_000,
    satuan: 'rupiah',
  },

  // --- Jasa STNK hilang -----------------------------------------------------
  {
    kode: 'jasaStnkHilang.platB.mobil',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa STNK hilang plat B mobil',
    nilai: 850_000,
    satuan: 'rupiah',
  },
  {
    kode: 'jasaStnkHilang.platB.motor',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa STNK hilang plat B motor',
    nilai: 750_000,
    satuan: 'rupiah',
  },
  {
    kode: 'jasaStnkHilang.platAF.mobil',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa STNK hilang plat A / F mobil',
    nilai: 950_000,
    satuan: 'rupiah',
  },
  {
    kode: 'jasaStnkHilang.platAF.motor',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa STNK hilang plat A / F motor',
    nilai: 800_000,
    satuan: 'rupiah',
  },

  // --- Jasa revisi nopol ----------------------------------------------------
  {
    kode: 'jasaRevisi.platB',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa revisi nopol plat B',
    nilai: 100_000,
    satuan: 'rupiah',
  },
  {
    kode: 'jasaRevisi.platAF',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa revisi nopol plat A / F',
    nilai: 150_000,
    satuan: 'rupiah',
  },
  {
    kode: 'jasaRevisi.platD',
    kelompok: 'Jasa & Pengurusan',
    label: 'Jasa revisi nopol plat D',
    nilai: 250_000,
    satuan: 'rupiah',
  },

  // --- Biaya penulisan ------------------------------------------------------
  {
    kode: 'penulisan.revisi.platB.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan revisi nopol plat B mobil',
    nilai: 350_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.revisi.platB.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan revisi nopol plat B motor',
    nilai: 300_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.revisi.platAF.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan revisi nopol plat A / F mobil',
    nilai: 450_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.revisi.platAF.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan revisi nopol plat A / F motor',
    nilai: 400_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.revisi.platD.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan revisi nopol plat D mobil',
    nilai: 500_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.revisi.platD.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan revisi nopol plat D motor',
    nilai: 400_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.gantiBuku.platB.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan ganti buku plat B mobil',
    nilai: 850_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.gantiBuku.platB.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan ganti buku plat B motor',
    nilai: 750_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.gantiBuku.platAF.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan ganti buku plat A / F mobil',
    nilai: 950_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.gantiBuku.platAF.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan ganti buku plat A / F motor',
    nilai: 850_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.gantiBuku.platD.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan ganti buku plat D mobil',
    nilai: 1_200_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.gantiBuku.platD.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan ganti buku plat D motor',
    nilai: 1_000_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.bbnLuarJadetabek',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan BBN / Mutasi luar Jadetabek',
    nilai: 1_500_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.bbnJadetabek.mobil',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan BBN / Mutasi dalam Jadetabek mobil',
    nilai: 800_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.bbnJadetabek.motor',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan BBN / Mutasi dalam Jadetabek motor',
    nilai: 700_000,
    satuan: 'rupiah',
  },
  {
    kode: 'penulisan.pindahAlamat',
    kelompok: 'Biaya Penulisan',
    label: 'Penulisan pindah alamat',
    nilai: 350_000,
    satuan: 'rupiah',
  },

  // --- Cadangan ETLE --------------------------------------------------------
  {
    kode: 'etle.mobil',
    kelompok: 'Biaya Lain',
    label: 'Cadangan ETLE mobil',
    nilai: 3_000_000,
    satuan: 'rupiah',
    catatan: 'Berlaku juga untuk pickup',
  },
  {
    kode: 'etle.motor',
    kelompok: 'Biaya Lain',
    label: 'Cadangan ETLE motor',
    nilai: 1_700_000,
    satuan: 'rupiah',
  },

  // --- Pengurusan luar kota -------------------------------------------------
  {
    kode: 'jauh.jasa',
    kelompok: 'Biaya Lain',
    label: 'Jasa pengurusan luar kota',
    nilai: 7_000_000,
    satuan: 'rupiah',
    catatan:
      'Angka tunggal untuk semua tujuan. Tabel rincian per tujuan belum dipakai menghitung, masih jadi catatan',
  },
  {
    kode: 'jauh.tarifPerKm',
    kelompok: 'Biaya Lain',
    label: 'Biaya transport per km',
    nilai: 700,
    satuan: 'rupiah/km',
    catatan: 'Dikali dua karena pulang pergi',
  },
]

/** Peta tarif siap pakai, dari daftar tarif mana pun. */
export function petaTarif(daftar: Tarif[] = TARIF_BAWAAN): Record<string, number> {
  const peta: Record<string, number> = {}
  for (const t of daftar) peta[t.kode] = t.nilai
  return peta
}

export type PetaTarif = Record<string, number>

/**
 * Mengambil tarif berdasarkan kode.
 * Sengaja melempar galat: tarif yang hilang harus ketahuan saat pengujian,
 * bukan diam-diam jadi nol di estimasi yang dikirim ke klien.
 */
export function ambilTarif(peta: PetaTarif, kode: string): number {
  const nilai = peta[kode]
  if (nilai === undefined) throw new Error(`Tarif tidak ditemukan: ${kode}`)
  return nilai
}
