import { useEffect, useMemo, useState } from 'react'
import { hitungEstimasi } from './core/hitung'
import { rapikanPenyesuaian, terapkanPenyesuaian } from './core/manual'
import {
  ISIAN_KOSONG,
  muatIsian,
  ruteGabungan,
  simpanIsian,
  tarifGabungan,
  terapkanIsian,
  type IsianHarga,
} from './core/simpanan'
import { petaTarif } from './core/tarif'
import type { InputEstimasi, PenyesuaianManual } from './core/tipe'
import { FormEstimasi } from './ui/FormEstimasi'
import { HalamanHarga } from './ui/HalamanHarga'
import { HasilEstimasi } from './ui/HasilEstimasi'
import { LayarKartu } from './ui/LayarKartu'
import { rupiah, tanggalHariIni } from './ui/format'

const KUNCI_DRAF = 'estimasi-stnk.draf'

const AWAL: InputEstimasi = {
  nopol: '',
  tanggalStnk: tanggalHariIni(),
  jasa: 'Perpanjang',
  kendaraan: 'Mobil',
  kecamatanAsal: '',
  kecamatanTujuan: '',
  samsatAsalPilihan: undefined,
  samsatTujuanPilihan: undefined,
  gantiKaleng: false,
  pkb: 0,
  swdkllj: 0,
  stnkHilang: false,
  pengurusanJauh: false,
  etle: false,
  matikanNopol: false,
  requestNopol: 'Tidak',
  jarak: 0,
  hotel: 0,
  tolTaksi: 0,
  makan: 0,
  tiketPesawat: 0,
  lokasiJauhAsal: '',
  lokasiJauhTujuan: '',
}

/** Draf disimpan di peramban supaya isian tidak hilang kalau halaman tertutup. */
function muatDraf(): InputEstimasi {
  try {
    const tersimpan = localStorage.getItem(KUNCI_DRAF)
    if (tersimpan) return { ...AWAL, ...JSON.parse(tersimpan) }
  } catch {
    // Penyimpanan peramban bisa ditolak (mode penyamaran, izin dimatikan).
    // Bukan masalah: aplikasi tetap jalan dengan isian kosong.
  }
  return AWAL
}

// Harga yang pernah diisi diberlakukan sebelum tampilan pertama digambar,
// supaya kalkulator tidak sempat memakai harga bawaan lalu berubah.
const isianAwal = muatIsian()
terapkanIsian(isianAwal)

type Halaman = 'kalkulator' | 'harga'
type Layar = 'isian' | 'hasil' | 'kartu'

/** Urutan langkah membuat estimasi, dari mengisi sampai kartu untuk klien. */
const LANGKAH: Layar[] = ['isian', 'hasil', 'kartu']

const JUDUL_LAYAR: Record<Layar, string> = {
  isian: 'Kalkulator Estimasi',
  hasil: 'Rincian Estimasi',
  kartu: 'Kartu untuk Klien',
}

const TOMBOL_LANJUT: Record<Layar, string> = {
  isian: 'Lihat Rincian',
  hasil: 'Buat Kartu',
  kartu: 'Ubah Isian',
}

export default function App() {
  const [input, setInput] = useState<InputEstimasi>(muatDraf)
  const [penyesuaian, setPenyesuaian] = useState<PenyesuaianManual[]>([])
  const [isian, setIsian] = useState<IsianHarga>(isianAwal)
  const [halaman, setHalaman] = useState<Halaman>('kalkulator')
  const [layar, setLayar] = useState<Layar>('isian')

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_DRAF, JSON.stringify(input))
    } catch {
      // Diabaikan dengan sengaja, lihat catatan di muatDraf.
    }
  }, [input])

  const ubahIsianHarga = (baru: IsianHarga) => {
    const tersimpan = simpanIsian(baru)
    terapkanIsian(tersimpan)
    setIsian(tersimpan)
  }

  const tarif = useMemo(() => petaTarif(tarifGabungan(isian)), [isian])
  const ruteBerlaku = useMemo(() => ruteGabungan(isian), [isian])

  // `isian` ikut jadi ketergantungan karena harga rute yang berlaku
  // disimpan di luar React, jadi perubahannya tidak terdeteksi sendiri.
  const dasar = useMemo(() => hitungEstimasi(input, tarif), [input, tarif, isian])

  const hasil = useMemo(
    () => terapkanPenyesuaian(dasar, rapikanPenyesuaian(dasar, penyesuaian), tarif),
    [dasar, penyesuaian, tarif],
  )

  const ubah = (perubahan: Partial<InputEstimasi>) =>
    setInput((lama) => ({ ...lama, ...perubahan }))

  const adaGagal = hasil.peringatan.some((p) => p.tingkat === 'gagal')
  const adaIsianHarga = Object.keys(isian.tarif).length > 0 || isian.rute.length > 0

  return (
    <div className="aplikasi">
      <header className="kepala">
        {halaman === 'kalkulator' && layar !== 'isian' && (
          <button
            type="button"
            className="tutup"
            onClick={() => setLayar(LANGKAH[LANGKAH.indexOf(layar) - 1])}
            aria-label="Kembali ke langkah sebelumnya"
          >
            ‹
          </button>
        )}
        <h1>
          <span className="merek">Surya Jasa</span>
          {halaman === 'harga' ? 'Daftar Harga' : JUDUL_LAYAR[layar]}
        </h1>
        <nav className="nav-utama">
          <button
            type="button"
            aria-current={halaman === 'kalkulator' ? 'page' : undefined}
            onClick={() => setHalaman('kalkulator')}
          >
            Kalkulator
          </button>
          <button
            type="button"
            aria-current={halaman === 'harga' ? 'page' : undefined}
            onClick={() => setHalaman('harga')}
          >
            Harga
          </button>
        </nav>
      </header>

      <main>
        {halaman === 'harga' ? (
          <HalamanHarga isian={isian} ruteBerlaku={ruteBerlaku} onUbah={ubahIsianHarga} />
        ) : layar === 'isian' ? (
          <FormEstimasi nilai={input} onUbah={ubah} />
        ) : layar === 'hasil' ? (
          <HasilEstimasi
            hasil={hasil}
            penyesuaian={penyesuaian}
            onUbahPenyesuaian={setPenyesuaian}
          />
        ) : (
          <LayarKartu hasil={hasil} />
        )}

        {halaman === 'harga' && adaIsianHarga && (
          <p className="catatan-kaki">
            Isianmu tersimpan di peramban perangkat ini saja. Supaya permanen dan dipakai semua
            orang, unduh berkasnya di bagian <b>Lihat &amp; Ekspor</b>.{' '}
            <button
              type="button"
              className="tombol-teks"
              onClick={() => ubahIsianHarga(ISIAN_KOSONG)}
            >
              Hapus semua isian
            </button>
          </p>
        )}
      </main>

      {halaman === 'kalkulator' && (
        <div className="bilah-total">
          <div className="bilah-isi">
            <div className="bilah-angka">
              <span className="bilah-ket">
                {adaGagal ? 'Estimasi belum lengkap' : 'Estimasi'}
              </span>
              <span className="bilah-nilai">{rupiah(hasil.total)}</span>
              {hasil.kodeDitimpa.length > 0 && (
                <span className="bilah-asli">
                  {hasil.kodeDitimpa.length} baris disesuaikan · asli {rupiah(hasil.totalAsli)}
                </span>
              )}
            </div>
            <button
              type="button"
              className="tombol tombol-utama"
              onClick={() =>
                setLayar(layar === 'kartu' ? 'isian' : LANGKAH[LANGKAH.indexOf(layar) + 1])
              }
            >
              {TOMBOL_LANJUT[layar]}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
