/**
 * Katalog daftar harga.
 *
 * Satu tempat yang mendaftar SELURUH tabel harga beserta kolom dan labelnya.
 * Gunanya: halaman admin dan fitur ekspor tidak perlu tahu isi tiap tabel —
 * keduanya cukup berjalan di atas katalog ini.
 *
 * Menambah tabel harga baru cukup mendaftarkannya di sini; halaman admin dan
 * ekspor langsung ikut mengenalinya tanpa perubahan kode lain.
 */

import {
  catatanJasaJauh,
  daftarKecamatan,
  daftarPerpanjang,
  daftarPerpanjangAcc,
  daftarRute,
  daftarSamsat,
} from './data'
import { TARIF_BAWAAN, type Tarif } from './tarif'

export type JenisKolom = 'teks' | 'rupiah' | 'angka' | 'yatidak'

export interface Kolom {
  /** Nama field di data. */
  kunci: string
  /** Judul kolom saat ditampilkan dan diekspor. */
  judul: string
  jenis: JenisKolom
}

export interface TabelHarga<T = Record<string, unknown>> {
  kode: string
  nama: string
  keterangan: string
  kolom: Kolom[]
  baris: T[]
  /** Tabel yang belum dipakai perhitungan, ditandai supaya tidak menyesatkan. */
  belumDipakai?: boolean
}

export function katalogHarga(tarif: Tarif[] = TARIF_BAWAAN): TabelHarga[] {
  return [
    {
      kode: 'tarif',
      nama: 'Tarif Dasar',
      keterangan:
        'Tarif satuan yang dipakai di seluruh perhitungan. Di Excel, angka-angka ini tertanam di dalam rumus.',
      kolom: [
        { kunci: 'kelompok', judul: 'Kelompok', jenis: 'teks' },
        { kunci: 'label', judul: 'Nama Tarif', jenis: 'teks' },
        { kunci: 'nilai', judul: 'Nilai', jenis: 'rupiah' },
        { kunci: 'satuan', judul: 'Satuan', jenis: 'teks' },
        { kunci: 'catatan', judul: 'Catatan', jenis: 'teks' },
      ],
      baris: tarif as unknown as Record<string, unknown>[],
    },
    {
      kode: 'rute',
      nama: 'Harga Rute',
      keterangan: 'Harga jasa Balik Nama dan Pindah Alamat per pasangan Samsat asal dan tujuan.',
      kolom: [
        { kunci: 'dari', judul: 'Dari', jenis: 'teks' },
        { kunci: 'ke', judul: 'Ke', jenis: 'teks' },
        { kunci: 'bbnMobil', judul: 'Balik Nama Mobil', jenis: 'rupiah' },
        { kunci: 'bbnMotor', judul: 'Balik Nama Motor', jenis: 'rupiah' },
        { kunci: 'pindahMobil', judul: 'Pindah Alamat Mobil', jenis: 'rupiah' },
        { kunci: 'pindahMotor', judul: 'Pindah Alamat Motor', jenis: 'rupiah' },
      ],
      baris: daftarRute as unknown as Record<string, unknown>[],
    },
    {
      kode: 'perpanjang',
      nama: 'Harga Perpanjang Tahunan',
      keterangan: 'Harga jasa perpanjangan tahunan per jenis kendaraan dan Samsat.',
      kolom: [
        { kunci: 'kendaraan', judul: 'Kendaraan', jenis: 'teks' },
        { kunci: 'samsat', judul: 'Samsat', jenis: 'teks' },
        { kunci: 'harga', judul: 'Harga', jenis: 'rupiah' },
      ],
      baris: daftarPerpanjang as unknown as Record<string, unknown>[],
    },
    {
      kode: 'perpanjang-acc',
      nama: 'Harga Perpanjang ACC KTP',
      keterangan:
        'Harga jasa perpanjangan dengan ACC KTP. Kolom "5 Tahun" menandai perpanjangan yang sekalian ganti kaleng.',
      kolom: [
        { kunci: 'kendaraan', judul: 'Kendaraan', jenis: 'teks' },
        { kunci: 'limaTahun', judul: '5 Tahun', jenis: 'yatidak' },
        { kunci: 'samsat', judul: 'Samsat', jenis: 'teks' },
        { kunci: 'harga', judul: 'Harga', jenis: 'rupiah' },
      ],
      baris: daftarPerpanjangAcc as unknown as Record<string, unknown>[],
    },
    {
      kode: 'kecamatan',
      nama: 'Daftar Kecamatan',
      keterangan: 'Penerjemah kecamatan ke Samsat yang menanganinya.',
      kolom: [
        { kunci: 'kecamatan', judul: 'Kecamatan', jenis: 'teks' },
        { kunci: 'samsat', judul: 'Samsat', jenis: 'teks' },
      ],
      baris: daftarKecamatan as unknown as Record<string, unknown>[],
    },
    {
      kode: 'samsat',
      nama: 'Daftar Samsat',
      keterangan: 'Daftar Samsat dan penanda apakah masuk wilayah Jabodetabek.',
      kolom: [
        { kunci: 'samsat', judul: 'Samsat', jenis: 'teks' },
        { kunci: 'jabodetabek', judul: 'Jabodetabek', jenis: 'yatidak' },
      ],
      baris: daftarSamsat as unknown as Record<string, unknown>[],
    },
    {
      kode: 'catatan-jasa-jauh',
      nama: 'Catatan Jasa Luar Kota',
      keterangan:
        'Rincian jasa dan akomodasi per tujuan. BELUM dipakai perhitungan — logikanya belum ditetapkan. Perhitungan luar kota memakai tarif tunggal.',
      belumDipakai: true,
      kolom: [
        { kunci: 'asal', judul: 'Asal', jenis: 'teks' },
        { kunci: 'tujuan', judul: 'Tujuan', jenis: 'teks' },
        { kunci: 'jasa', judul: 'Jasa', jenis: 'rupiah' },
        { kunci: 'akomodasi', judul: 'Akomodasi', jenis: 'rupiah' },
      ],
      baris: catatanJasaJauh as unknown as Record<string, unknown>[],
    },
  ]
}
