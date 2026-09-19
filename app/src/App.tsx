import { useEffect, useMemo, useState } from 'react'
import { hitungEstimasi } from './core/hitung'
import { rapikanPenyesuaian, terapkanPenyesuaian } from './core/manual'
import { petaTarif } from './core/tarif'
import type { InputEstimasi, PenyesuaianManual } from './core/tipe'
import { FormEstimasi } from './ui/FormEstimasi'
import { HasilEstimasi } from './ui/HasilEstimasi'
import { rupiah, tanggalHariIni } from './ui/format'

const KUNCI_SIMPANAN = 'estimasi-stnk.draf'

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
    const tersimpan = localStorage.getItem(KUNCI_SIMPANAN)
    if (tersimpan) return { ...AWAL, ...JSON.parse(tersimpan) }
  } catch {
    // Penyimpanan peramban bisa ditolak (mode penyamaran, izin dimatikan).
    // Bukan masalah: aplikasi tetap jalan dengan isian kosong.
  }
  return AWAL
}

const tarif = petaTarif()

export default function App() {
  const [input, setInput] = useState<InputEstimasi>(muatDraf)
  const [penyesuaian, setPenyesuaian] = useState<PenyesuaianManual[]>([])
  const [layar, setLayar] = useState<'isian' | 'hasil'>('isian')

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_SIMPANAN, JSON.stringify(input))
    } catch {
      // Diabaikan dengan sengaja, lihat catatan di muatDraf.
    }
  }, [input])

  const dasar = useMemo(() => hitungEstimasi(input, tarif), [input])

  const hasil = useMemo(
    () => terapkanPenyesuaian(dasar, rapikanPenyesuaian(dasar, penyesuaian), tarif),
    [dasar, penyesuaian],
  )

  const ubah = (perubahan: Partial<InputEstimasi>) =>
    setInput((lama) => ({ ...lama, ...perubahan }))

  const adaGagal = hasil.peringatan.some((p) => p.tingkat === 'gagal')

  return (
    <div className="aplikasi">
      <header className="kepala">
        {layar === 'hasil' && (
          <button
            type="button"
            className="tutup"
            onClick={() => setLayar('isian')}
            aria-label="Kembali ke isian"
          >
            ‹
          </button>
        )}
        <h1>
          <span className="merek">Surya Jasa</span>
          {layar === 'isian' ? 'Kalkulator Estimasi' : 'Rincian Estimasi'}
        </h1>
        {layar === 'isian' && (
          <button
            type="button"
            className="tombol-teks"
            onClick={() => {
              setInput({ ...AWAL, tanggalStnk: tanggalHariIni() })
              setPenyesuaian([])
            }}
          >
            Reset
          </button>
        )}
      </header>

      <main>
        {layar === 'isian' ? (
          <FormEstimasi nilai={input} onUbah={ubah} />
        ) : (
          <HasilEstimasi
            hasil={hasil}
            penyesuaian={penyesuaian}
            onUbahPenyesuaian={setPenyesuaian}
          />
        )}
      </main>

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
            onClick={() => setLayar(layar === 'isian' ? 'hasil' : 'isian')}
          >
            {layar === 'isian' ? 'Lihat Rincian' : 'Ubah Isian'}
          </button>
        </div>
      </div>
    </div>
  )
}
