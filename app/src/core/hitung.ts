/**
 * Mesin hitung estimasi.
 *
 * Terjemahan langsung dari sheet `Rumus Utama` di `Surya Jasa - Estimasi v2.xlsx`.
 * Setiap fungsi diberi tanda sel asalnya supaya bisa ditelusuri kembali ke Excel
 * kalau suatu saat ada selisih angka yang perlu dipertanggungjawabkan.
 *
 * Aturan: tidak ada satu pun tarif yang ditulis langsung di berkas ini.
 * Semua diambil dari peta tarif, supaya bisa diubah lewat halaman admin.
 */

import {
  cariHargaPerpanjang,
  cariHargaPerpanjangAcc,
  cariRuteDuaArah,
  cariRuteSearah,
  samsatDariKecamatan,
  samsatJabodetabek,
  KECAMATAN_LAINNYA,
} from './data'
import { ambilTarif, petaTarif, type PetaTarif } from './tarif'
import {
  JASA_DUA_LOKASI,
  JASA_PERPANJANG,
  JASA_REVISI,
  type BarisBiaya,
  type HasilEstimasi,
  type InputEstimasi,
  type JenisKendaraan,
  type KelompokBiaya,
  type Peringatan,
} from './tipe'

// ---------------------------------------------------------------------------
// Bantuan angka, mengikuti perilaku Excel
// ---------------------------------------------------------------------------

/** Setara CEILING(n, kelipatan) di Excel. */
const bulatkanKeAtas = (n: number, kelipatan: number) =>
  kelipatan === 0 ? 0 : Math.ceil(n / kelipatan) * kelipatan

/** Setara ROUND(n, -3) di Excel. */
const bulatkanRibuan = (n: number) => Math.round(n / 1000) * 1000

/** Setara ROUNDUP(n, -6) di Excel. */
const bulatkanKeAtasJuta = (n: number) => Math.ceil(n / 1_000_000) * 1_000_000

const angka = (n: number | null | undefined) => (typeof n === 'number' && isFinite(n) ? n : 0)

// ---------------------------------------------------------------------------
// Tanggal
// ---------------------------------------------------------------------------

interface BagianTanggal {
  tahun: number
  bulan: number
  hari: number
}

export function uraiTanggal(iso: string): BagianTanggal | null {
  const c = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((iso ?? '').trim())
  if (!c) return null
  const tahun = Number(c[1])
  const bulan = Number(c[2])
  const hari = Number(c[3])
  if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31) return null
  return { tahun, bulan, hari }
}

/**
 * Bulan keterlambatan (sel B10).
 *
 * Dihitung dari bulan dan tahun STNK sampai bulan dan tahun hari ini, lalu
 * ditambah margin. Tanggal dalam bulan sengaja diabaikan: di Excel angka ini
 * memang ditulis per bulan, bukan per hari.
 *
 * Terbukti cocok dengan dua contoh di Excel:
 *   STNK Jun 2024, disusun Nov 2025  -> 12 + 5 + 2 = 19
 *   STNK Sep 2026, acuan Sep 2026    ->  0 + 0 + 2 =  2
 */
export function hitungBulanTelat(
  tanggalStnk: string,
  tanggalAcuan: BagianTanggal,
  marginBulan: number,
): number | null {
  const stnk = uraiTanggal(tanggalStnk)
  if (!stnk) return null
  const selisih =
    (tanggalAcuan.tahun - stnk.tahun) * 12 + (tanggalAcuan.bulan - stnk.bulan)
  return Math.max(0, selisih + marginBulan)
}

function acuanHariIni(input: InputEstimasi): BagianTanggal {
  const dari = input.tanggalAcuan ? uraiTanggal(input.tanggalAcuan) : null
  if (dari) return dari
  const kini = new Date()
  return { tahun: kini.getFullYear(), bulan: kini.getMonth() + 1, hari: kini.getDate() }
}

// ---------------------------------------------------------------------------
// Penggolongan
// ---------------------------------------------------------------------------

type Plat = 'B' | 'A' | 'F' | 'D' | null

/** Huruf depan nopol menentukan sebagian besar tarif jasa. */
export function platDariNopol(nopol: string): Plat {
  const huruf = (nopol ?? '').trim().charAt(0).toUpperCase()
  return huruf === 'B' || huruf === 'A' || huruf === 'F' || huruf === 'D' ? huruf : null
}

const rodaEmpat = (k: JenisKendaraan) => k === 'Mobil' || k === 'Pickup'

/** Pickup memakai kolom harga mobil di semua tabel. */
const kolomKendaraan = (k: JenisKendaraan): 'Mobil' | 'Motor' =>
  rodaEmpat(k) ? 'Mobil' : 'Motor'

// ---------------------------------------------------------------------------
// Hasil setiap baris biaya
// ---------------------------------------------------------------------------

interface Konteks {
  input: InputEstimasi
  t: PetaTarif
  plat: Plat
  samsatAsal: string | null
  samsatTujuan: string | null
  jadetabek: boolean
  bulanTelat: number
  tahunJr: number
  skpPerBulan: number
  peringatan: Peringatan[]
}

/** Sel B41: SKP satu bulan. */
function skpSatuBulan(pkb: number, persenDenda: number): number {
  return bulatkanKeAtas((pkb * (persenDenda / 100) + pkb) / 12, 1000)
}

/** Sel H5: SKP. */
function hitungSkp(k: Konteks): number {
  const { input, bulanTelat, skpPerBulan } = k
  if (input.jasa === 'Mutasi' || bulanTelat >= 12) {
    return Math.ceil(skpPerBulan * bulanTelat)
  }
  return 0
}

/** Sel H6: Jasa Raharja. */
function hitungJr(k: Konteks, skp: number): number {
  if (skp === 0) return 0
  const { input, t, tahunJr } = k
  const tambahan = rodaEmpat(input.kendaraan)
    ? ambilTarif(t, 'swdkllj.tambahanMobil')
    : ambilTarif(t, 'swdkllj.tambahanMotor')
  const dasar = (input.swdkllj + tambahan) * tahunJr
  return input.kendaraan === 'Pickup' ? dasar + ambilTarif(t, 'jr.tambahanPickup') : dasar
}

/** Sel H7: print SKP. */
function hitungPrintSkp(k: Konteks, skp: number): number {
  if (skp === 0) return 0
  const per5 = ambilTarif(k.t, 'skp.printPer5Tahun')
  return k.tahunJr === 0 ? per5 : Math.ceil(k.tahunJr / 5) * per5
}

/** Sel H9: PKB. */
function hitungPkb(k: Konteks): number {
  const { input, t, bulanTelat } = k
  if (JASA_REVISI.includes(input.jasa)) return 0
  if (input.jasa === 'Mutasi') return input.pkb
  if (bulanTelat >= 0 && bulanTelat < 12) {
    const persen = ambilTarif(t, 'denda.persenPkbPerBulan') / 100
    return bulatkanRibuan(input.pkb * persen * bulanTelat + input.pkb)
  }
  return bulatkanRibuan(input.pkb)
}

/** Sel H10: SWDKLLJ. */
function hitungSwdkllj(k: Konteks): number {
  const { input, t } = k
  if (JASA_REVISI.includes(input.jasa)) return 0
  return (
    input.swdkllj +
    (rodaEmpat(input.kendaraan)
      ? ambilTarif(t, 'swdkllj.tambahanMobil')
      : ambilTarif(t, 'swdkllj.tambahanMotor'))
  )
}

/** Sel H11: administrasi STNK. */
function hitungAdmStnk(k: Konteks): number {
  const { input, t } = k
  const perluStnkBaru =
    ['BBN', 'Mutasi', 'Pindah Alamat', 'STNK Hilang'].includes(input.jasa) ||
    (JASA_PERPANJANG.includes(input.jasa) && input.gantiKaleng)
  if (!perluStnkBaru) return 0
  return rodaEmpat(input.kendaraan)
    ? ambilTarif(t, 'admStnk.mobil')
    : ambilTarif(t, 'admStnk.motor')
}

/**
 * Sel H12: TNKB.
 *
 * Di Excel, TNKB ditentukan dari BESARNYA biaya administrasi STNK
 * (`IF(H11=200000,100000,...)`). Di sini ditentukan dari jenis kendaraannya
 * langsung, supaya mengubah tarif administrasi tidak diam-diam membuat TNKB
 * jadi nol. Hasilnya sama persis selama tarif administrasi tidak diubah.
 */
function hitungTnkb(k: Konteks, admStnk: number): number {
  const { input, t } = k
  switch (input.requestNopol) {
    case '3 Angka Ada Huruf':
      return ambilTarif(t, 'nopol.req3Angka')
    case '2 Angka Ada Huruf':
      return ambilTarif(t, 'nopol.req2Angka')
    case '1 Angka Ada Huruf':
      return ambilTarif(t, 'nopol.req1Angka')
    case 'Ganjil/Genap':
      return ambilTarif(t, 'nopol.tnkbGanjilGenap')
    default:
      if (admStnk <= 0) return 0
      return rodaEmpat(input.kendaraan)
        ? ambilTarif(t, 'tnkb.mobil')
        : ambilTarif(t, 'tnkb.motor')
  }
}

/** Sel H14: cek fisik. */
function hitungCekFisik(k: Konteks): number {
  const { input, t, jadetabek, plat } = k

  const antarDaerah = input.jasa === 'BBN' || input.jasa === 'Mutasi'
  if (antarDaerah || input.jasa === 'Pindah Alamat') {
    return ambilTarif(t, jadetabek ? 'cekFisik.jadetabek' : 'cekFisik.luarJadetabek')
  }
  if (JASA_PERPANJANG.includes(input.jasa) && input.gantiKaleng) {
    return ambilTarif(t, 'cekFisik.jadetabek')
  }
  if (input.jasa === 'STNK Hilang') return ambilTarif(t, 'cekFisik.stnkHilang')
  if (JASA_REVISI.includes(input.jasa)) {
    const gantiBuku = input.jasa === 'Revisi Nopol Ganti Buku'
    const platB = ambilTarif(t, 'cekFisik.revisiPlatB')
    const platLain = ambilTarif(t, 'cekFisik.revisiPlatLain')
    if (plat === 'D') return platLain
    if (plat === 'B') return platB
    if (plat === 'A' || plat === 'F') return gantiBuku ? platLain : platB
    return 0
  }
  return 0
}

/**
 * Sel H15: jumlah lembar kertas gesek.
 *
 * Aturannya: cek fisik sampai batas satu lembar (200.000) cukup satu lembar
 * gesek; di atas itu berarti cek fisik luar kota yang butuh beberapa lembar.
 *
 * Di Excel aturan ini ditulis sebagai kecocokan angka persis
 * (`if(H14=450000,45000, if(H14=150000,15000, ...))`), sehingga menaikkan tarif
 * cek fisik satu rupiah saja membuat kertas gesek jatuh ke nol. Memakai rentang
 * menghilangkan jebakan itu tanpa mengubah hasil untuk tarif yang berlaku
 * sekarang — termasuk saat cek fisik ditimpa manual.
 */
export function hitungLembarGesek(nilaiCekFisik: number, t: PetaTarif): number {
  if (nilaiCekFisik <= 0) return 0
  return nilaiCekFisik <= ambilTarif(t, 'kertasGesek.batasSatuLembar')
    ? 1
    : ambilTarif(t, 'kertasGesek.lembarLuarKota')
}

/** Sel H15: biaya kertas gesek, mengikuti besaran cek fisik yang berlaku. */
export function hitungKertasGesek(nilaiCekFisik: number, t: PetaTarif): number {
  return hitungLembarGesek(nilaiCekFisik, t) * ambilTarif(t, 'kertasGesek.perLembar')
}

/** Sel H16: buka blokir. */
function hitungBukaBlokir(k: Konteks): number {
  const { input, t } = k
  const umum =
    input.jasa === 'BBN' ||
    input.jasa === 'Pindah Alamat' ||
    JASA_REVISI.includes(input.jasa) ||
    (input.jasa === 'Mutasi' && !input.pengurusanJauh)
  if (umum) return ambilTarif(t, 'bukaBlokir.umum')
  if (input.jasa === 'Mutasi' && input.pengurusanJauh) {
    return ambilTarif(t, 'bukaBlokir.mutasiJauh')
  }
  return 0
}

/** Sel B34: jasa STNK hilang. */
function jasaStnkHilang(k: Konteks): number {
  const { input, t, plat } = k
  const roda4 = rodaEmpat(input.kendaraan)
  if (plat === 'B') {
    return ambilTarif(t, roda4 ? 'jasaStnkHilang.platB.mobil' : 'jasaStnkHilang.platB.motor')
  }
  if (plat === 'A' || plat === 'F') {
    return ambilTarif(t, roda4 ? 'jasaStnkHilang.platAF.mobil' : 'jasaStnkHilang.platAF.motor')
  }
  return 0
}

/** Sel B35: jasa revisi nopol. Excel mengembalikan teks "MANUAL" bila plat asing. */
function jasaRevisiNopol(k: Konteks): number {
  const { t, plat } = k
  if (plat === 'B') return ambilTarif(t, 'jasaRevisi.platB')
  if (plat === 'A' || plat === 'F') return ambilTarif(t, 'jasaRevisi.platAF')
  if (plat === 'D') return ambilTarif(t, 'jasaRevisi.platD')
  k.peringatan.push({
    tingkat: 'perhatian',
    pesan: 'Plat nomor tidak dikenal, jasa revisi nopol perlu diisi manual.',
  })
  return 0
}

/** Sel H17: jasa. */
function hitungJasa(k: Konteks): number {
  const { input, t, samsatAsal, samsatTujuan } = k
  const kolom = kolomKendaraan(input.kendaraan)

  if (input.pengurusanJauh) {
    const didukung = ['BBN', 'Mutasi', ...JASA_PERPANJANG].includes(input.jasa)
    return didukung ? ambilTarif(t, 'jauh.jasa') : 0
  }

  const butuhRute = JASA_DUA_LOKASI.includes(input.jasa)
  if (butuhRute) {
    if (!samsatAsal || !samsatTujuan) {
      k.peringatan.push({ tingkat: 'gagal', pesan: 'Samsat asal atau tujuan belum lengkap.' })
      return 0
    }
    // Balik Nama dicari satu arah, seperti di Excel. Mutasi dan Pindah Alamat dua arah.
    const rute =
      input.jasa === 'BBN'
        ? cariRuteSearah(samsatAsal, samsatTujuan)
        : cariRuteDuaArah(samsatAsal, samsatTujuan)
    if (!rute) {
      k.peringatan.push({
        tingkat: 'gagal',
        pesan: `Harga rute ${samsatAsal} ke ${samsatTujuan} belum ada di daftar harga.`,
      })
      return 0
    }
    const nilai =
      input.jasa === 'Pindah Alamat'
        ? kolom === 'Mobil'
          ? rute.pindahMobil
          : rute.pindahMotor
        : kolom === 'Mobil'
          ? rute.bbnMobil
          : rute.bbnMotor
    if (nilai === null) {
      k.peringatan.push({
        tingkat: 'gagal',
        pesan: `Harga ${input.jasa} untuk rute ${samsatAsal} ke ${samsatTujuan} kosong.`,
      })
      return 0
    }
    return nilai
  }

  if (input.jasa === 'Perpanjang') {
    if (!samsatAsal) return 0
    const harga = cariHargaPerpanjang(kolom, samsatAsal)
    if (harga === null) {
      k.peringatan.push({
        tingkat: 'gagal',
        pesan: `Harga perpanjang ${kolom} di Samsat ${samsatAsal} belum ada di daftar harga.`,
      })
      return 0
    }
    return harga
  }

  if (input.jasa === 'Perpanjang ACC KTP') {
    if (!samsatAsal) return 0
    const harga = cariHargaPerpanjangAcc(kolom, input.gantiKaleng, samsatAsal)
    if (harga === null) {
      k.peringatan.push({
        tingkat: 'gagal',
        pesan: `Harga perpanjang ACC KTP ${kolom} di Samsat ${samsatAsal} belum ada di daftar harga.`,
      })
      return 0
    }
    return harga
  }

  if (input.jasa === 'STNK Hilang') return jasaStnkHilang(k)
  if (JASA_REVISI.includes(input.jasa)) return jasaRevisiNopol(k)
  return 0
}

/** Sel B38: biaya penulisan. */
function hitungPenulisan(k: Konteks): number {
  const { input, t, plat, jadetabek } = k
  const roda4 = rodaEmpat(input.kendaraan)
  const sisi = roda4 ? 'mobil' : 'motor'

  if (JASA_REVISI.includes(input.jasa)) {
    const jenis = input.jasa === 'Revisi Nopol Ganti Buku' ? 'gantiBuku' : 'revisi'
    const grup = plat === 'B' ? 'platB' : plat === 'D' ? 'platD' : plat ? 'platAF' : null
    if (!grup) {
      k.peringatan.push({
        tingkat: 'perhatian',
        pesan: 'Plat nomor tidak dikenal, biaya penulisan perlu diisi manual.',
      })
      return 0
    }
    return ambilTarif(t, `penulisan.${jenis}.${grup}.${sisi}`)
  }

  if (input.jasa === 'BBN' || input.jasa === 'Mutasi') {
    if (!jadetabek) return ambilTarif(t, 'penulisan.bbnLuarJadetabek')
    return ambilTarif(t, `penulisan.bbnJadetabek.${sisi}`)
  }

  if (input.jasa === 'Pindah Alamat') return ambilTarif(t, 'penulisan.pindahAlamat')
  return 0
}

/** Sel B37 dan H26: transportasi dan akomodasi luar kota. */
function hitungTransport(k: Konteks): number {
  const { input, t } = k
  const didukung = ['BBN', 'Mutasi', ...JASA_PERPANJANG].includes(input.jasa)
  if (!input.pengurusanJauh || !didukung) return 0
  const perKm = ambilTarif(t, 'jauh.tarifPerKm')
  const total =
    angka(input.jarak) * 2 * perKm +
    angka(input.hotel) +
    angka(input.tolTaksi) +
    angka(input.makan) +
    angka(input.tiketPesawat)
  return bulatkanKeAtasJuta(total)
}

/** Sel F4: judul estimasi. */
function susunJudul(k: Konteks): string {
  const { input, samsatAsal, samsatTujuan } = k
  if (input.pengurusanJauh) {
    const asal = input.lokasiJauhAsal || samsatAsal || '?'
    const tujuan = input.lokasiJauhTujuan || '?'
    if (input.jasa === 'BBN' || input.jasa === 'Mutasi') {
      return `${input.jasa} ${asal} - ${tujuan}`
    }
    if (JASA_PERPANJANG.includes(input.jasa)) return `${input.jasa} ${asal}`
    return input.jasa
  }
  if (JASA_DUA_LOKASI.includes(input.jasa)) {
    return `${input.jasa} ${samsatAsal ?? '?'} - ${samsatTujuan ?? '?'}`
  }
  return `${input.jasa} ${samsatAsal ?? '?'}`
}

// ---------------------------------------------------------------------------
// Perhitungan utama
// ---------------------------------------------------------------------------

export function hitungEstimasi(
  input: InputEstimasi,
  tarif: PetaTarif = petaTarif(),
): HasilEstimasi {
  const peringatan: Peringatan[] = []
  const acuan = acuanHariIni(input)

  const samsatAsal =
    input.kecamatanAsal === KECAMATAN_LAINNYA
      ? null
      : (input.samsatAsalPilihan ?? samsatDariKecamatan(input.kecamatanAsal))
  const perluTujuan = JASA_DUA_LOKASI.includes(input.jasa)
  const samsatTujuan = !perluTujuan
    ? null
    : input.kecamatanTujuan === KECAMATAN_LAINNYA
      ? null
      : (input.samsatTujuanPilihan ?? samsatDariKecamatan(input.kecamatanTujuan))

  if (input.kecamatanAsal && input.kecamatanAsal !== KECAMATAN_LAINNYA && !samsatAsal) {
    peringatan.push({
      tingkat: 'gagal',
      pesan: `Kecamatan "${input.kecamatanAsal}" tidak ada di daftar daerah.`,
    })
  }
  if (perluTujuan && input.kecamatanTujuan && input.kecamatanTujuan !== KECAMATAN_LAINNYA && !samsatTujuan) {
    peringatan.push({
      tingkat: 'gagal',
      pesan: `Kecamatan "${input.kecamatanTujuan}" tidak ada di daftar daerah.`,
    })
  }

  // Sel B44
  const jadetabek =
    samsatJabodetabek(samsatAsal) === true &&
    samsatJabodetabek(samsatTujuan) === true &&
    !input.pengurusanJauh

  const marginBulan = ambilTarif(tarif, 'denda.marginBulan')
  const bulanTelatMentah = hitungBulanTelat(input.tanggalStnk, acuan, marginBulan)
  if (bulanTelatMentah === null && input.tanggalStnk) {
    peringatan.push({ tingkat: 'perhatian', pesan: 'Tanggal STNK belum diisi dengan benar.' })
  }
  const bulanTelat = bulanTelatMentah ?? 0

  // Sel B25
  const tahunJr = bulanTelat === 0 ? 1 : Math.ceil(bulanTelat / 12)

  const k: Konteks = {
    input,
    t: tarif,
    plat: platDariNopol(input.nopol),
    samsatAsal,
    samsatTujuan,
    jadetabek,
    bulanTelat,
    tahunJr,
    skpPerBulan: skpSatuBulan(input.pkb, ambilTarif(tarif, 'denda.persenSkp')),
    peringatan,
  }

  // --- Kelompok 1: denda keterlambatan (Excel I8)
  const skp = hitungSkp(k)
  const jr = hitungJr(k, skp)
  const printSkp = hitungPrintSkp(k, skp)

  // --- Kelompok 2: pajak dan penerbitan (Excel I13)
  const pkb = hitungPkb(k)
  const swdkllj = hitungSwdkllj(k)
  const admStnk = hitungAdmStnk(k)
  const tnkb = hitungTnkb(k, admStnk)

  // --- Kelompok 3: jasa dan pengurusan (Excel I18)
  const cekFisik = hitungCekFisik(k)
  const kertasGesek = hitungKertasGesek(cekFisik, tarif)
  const bukaBlokir = hitungBukaBlokir(k)
  const jasa = hitungJasa(k)

  // --- Kelompok 4: nopol pilihan (Excel I22)
  const matikanNopol = input.matikanNopol ? ambilTarif(tarif, 'nopol.matikan') : 0
  const requestNopol =
    input.requestNopol === 'Ganjil/Genap' ? ambilTarif(tarif, 'nopol.reqGanjilGenap') : 0
  const admNopol =
    input.requestNopol === 'Ganjil/Genap'
      ? ambilTarif(tarif, 'nopol.admGanjilGenap')
      : input.requestNopol !== 'Tidak'
        ? ambilTarif(tarif, 'nopol.admPilihan')
        : 0

  // --- Kelompok 5: biaya lain (Excel I27)
  const penulisan = hitungPenulisan(k)
  const stnkHilangTambahan =
    input.jasa !== 'STNK Hilang' && input.stnkHilang ? jasaStnkHilang(k) : 0
  const etle = input.etle
    ? rodaEmpat(input.kendaraan)
      ? ambilTarif(tarif, 'etle.mobil')
      : ambilTarif(tarif, 'etle.motor')
    : 0
  const transport = hitungTransport(k)

  const kelompok: KelompokBiaya[] = [
    susunKelompok('denda', 'Denda Keterlambatan', [
      { kode: 'skp', label: 'SKP', nilai: skp, rincian: `${bulanTelat} bulan x SKP per bulan` },
      { kode: 'jr', label: 'Jasa Raharja', nilai: jr, rincian: `${tahunJr} tahun` },
      { kode: 'printSkp', label: 'Print SKP', nilai: printSkp },
    ]),
    susunKelompok('pajak', 'Pajak & Penerbitan', [
      { kode: 'pkb', label: 'PKB', nilai: pkb },
      { kode: 'swdkllj', label: 'SWDKLLJ', nilai: swdkllj },
      { kode: 'admStnk', label: 'Administrasi STNK', nilai: admStnk },
      { kode: 'tnkb', label: 'TNKB', nilai: tnkb },
    ]),
    susunKelompok('jasa', 'Jasa & Pengurusan', [
      { kode: 'cekFisik', label: 'Cek Fisik', nilai: cekFisik },
      {
        kode: 'kertasGesek',
        label: 'Kertas Gesek',
        nilai: kertasGesek,
        rincian: `${hitungLembarGesek(cekFisik, tarif)} lembar`,
      },
      { kode: 'bukaBlokir', label: 'Buka Blokir', nilai: bukaBlokir },
      { kode: 'jasaUtama', label: 'Jasa', nilai: jasa },
    ]),
    susunKelompok('nopol', 'Nopol Pilihan', [
      { kode: 'matikanNopol', label: 'Matikan Nopol', nilai: matikanNopol },
      { kode: 'requestNopol', label: 'Request Nopol', nilai: requestNopol },
      { kode: 'admNopol', label: 'Administrasi Nopol', nilai: admNopol },
    ]),
    susunKelompok('lain', 'Biaya Lain', [
      { kode: 'penulisan', label: 'Penulisan BPKB', nilai: penulisan },
      { kode: 'stnkHilangTambahan', label: 'STNK Hilang', nilai: stnkHilangTambahan },
      { kode: 'etle', label: 'Cadangan ETLE', nilai: etle },
      { kode: 'transport', label: 'Transportasi & Akomodasi', nilai: transport },
    ]),
  ]

  const total = bulatkanRibuan(kelompok.reduce((j, g) => j + g.subtotal, 0))

  return {
    judul: susunJudul(k),
    nopol: input.nopol,
    tanggalStnk: input.tanggalStnk,
    samsatAsal,
    samsatTujuan,
    jadetabek,
    bulanTelat,
    tahunJr,
    kelompok,
    total,
    peringatan,
  }
}

function susunKelompok(kode: string, judul: string, baris: BarisBiaya[]): KelompokBiaya {
  return { kode, judul, baris, subtotal: baris.reduce((j, b) => j + b.nilai, 0) }
}
