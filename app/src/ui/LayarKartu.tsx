/**
 * Layar kartu estimasi.
 *
 * Kartu digambar di luar layar pada ukuran tetap, lalu hasilnya ditampilkan
 * sebagai gambar. Yang dilihat staf di sini persis yang diterima klien.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { kartuLayakDikirim } from '../core/kartu'
import type { HasilDenganPenyesuaian } from '../core/tipe'
import { Kartu, Peringatan } from './dasar'
import { bagikanGambar, buatGambar, namaBerkasGambar, unduhGambar } from './gambar'
import { KartuEstimasi } from './KartuEstimasi'

type Keadaan = 'menggambar' | 'siap' | 'gagal'

export function LayarKartu({ hasil }: { hasil: HasilDenganPenyesuaian }) {
  const panggung = useRef<HTMLDivElement>(null)
  const [gambar, setGambar] = useState<string | null>(null)
  const [keadaan, setKeadaan] = useState<Keadaan>('menggambar')
  const [pesan, setPesan] = useState<string | null>(null)

  const gambarUlang = useCallback(async () => {
    if (!panggung.current) return
    setKeadaan('menggambar')
    try {
      // Sekali gambar buang dulu: pemanggilan pertama html-to-image kadang
      // keluar sebelum huruf selesai dimuat, dan hasilnya jadi kosong.
      await buatGambar(panggung.current)
      const hasilGambar = await buatGambar(panggung.current)
      setGambar(hasilGambar.dataUrl)
      setKeadaan('siap')
    } catch {
      setKeadaan('gagal')
    }
  }, [])

  useEffect(() => {
    void gambarUlang()
  }, [gambarUlang, hasil])

  const namaBerkas = namaBerkasGambar(hasil.nopol)

  const simpan = async () => {
    if (!gambar) return
    if (await bagikanGambar(gambar, namaBerkas)) {
      setPesan('Gambar dikirim ke menu berbagi.')
      return
    }
    // Unduhan bisa diam-diam tidak jalan: Safari di iPhone kerap menolaknya,
    // dan halaman yang dimuat di dalam kerangka terbatas ikut memblokirnya.
    // Karena itu petunjuk cadangan selalu disebut, bukan hanya saat gagal.
    unduhGambar(gambar, namaBerkas)
    setPesan(
      `Gambar sedang diunduh sebagai ${namaBerkas}. Kalau tidak tersimpan otomatis, ` +
        'tekan lama gambar di bawah lalu pilih simpan.',
    )
  }

  return (
    <>
      {/* Kartu sungguhan, digambar di luar layar pada ukuran tetap. */}
      <div className="panggung-kartu" aria-hidden="true">
        <KartuEstimasi hasil={hasil} ref={panggung} />
      </div>

      {!kartuLayakDikirim(hasil) && (
        <Peringatan tingkat="gagal">
          <span>
            <b>Estimasi belum lengkap.</b> Masih ada harga yang belum ada di daftar, jadi kartu ini
            belum layak dikirim ke klien.
          </span>
        </Peringatan>
      )}

      <Kartu judul="Yang Diterima Klien">
        <p className="keterangan">
          Rincian lengkap per kelompok biaya. Baris bernilai nol tidak ikut ditampilkan, dan
          penyesuaian manual tidak ditandai — klien hanya melihat angka yang berlaku.
        </p>

        <div className="tombol-berjajar">
          <button
            type="button"
            className="tombol tombol-utama"
            onClick={simpan}
            disabled={keadaan !== 'siap'}
          >
            {keadaan === 'menggambar' ? 'Menyiapkan…' : 'Simpan Gambar'}
          </button>
          <button type="button" className="tombol tombol-kedua" onClick={() => void gambarUlang()}>
            Gambar Ulang
          </button>
        </div>

        {pesan && (
          <Peringatan tingkat="info">
            <span>{pesan}</span>
          </Peringatan>
        )}
        {keadaan === 'gagal' && (
          <Peringatan tingkat="gagal">
            <span>
              Gambar gagal dibuat di peramban ini. Coba <b>Gambar Ulang</b>, atau buka lewat
              peramban lain.
            </span>
          </Peringatan>
        )}
      </Kartu>

      <div className="pratinjau">
        {gambar ? (
          <img src={gambar} alt={`Kartu estimasi ${hasil.nopol}`} />
        ) : (
          <div className="pratinjau-kosong">
            {keadaan === 'gagal' ? 'Gambar gagal dibuat.' : 'Menyiapkan gambar…'}
          </div>
        )}
      </div>

      <p className="catatan-kaki">
        Di HP, <b>Simpan Gambar</b> membuka menu berbagi bawaan sehingga bisa langsung dikirim ke
        WhatsApp. Di komputer, gambarnya diunduh sebagai berkas.
      </p>
    </>
  )
}
