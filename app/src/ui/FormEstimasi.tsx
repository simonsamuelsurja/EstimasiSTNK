/** Formulir masukan. Isian yang tidak relevan disembunyikan, bukan dinonaktifkan. */

import { hitungBulanTelat, uraiTanggal } from '../core/hitung'
import { petaTarif } from '../core/tarif'
import {
  JASA_PERLU_TUJUAN,
  JASA_PERPANJANG,
  JENIS_JASA,
  JENIS_KENDARAAN,
  PILIHAN_NOPOL,
  type InputEstimasi,
  type JenisJasa,
  type JenisKendaraan,
  type PilihanNopol,
} from '../core/tipe'
import { BarisIsian, IsianRupiah, Kartu, Sakelar, Segmen } from './dasar'
import { tanggalHariIni } from './format'
import { PilihDaerah } from './PilihDaerah'
import { PilihTanggal } from './PilihTanggal'

const tarif = petaTarif()

export function FormEstimasi({
  nilai,
  onUbah,
}: {
  nilai: InputEstimasi
  onUbah: (perubahan: Partial<InputEstimasi>) => void
}) {
  const perluTujuan = JASA_PERLU_TUJUAN.includes(nilai.jasa)
  const perpanjangan = JASA_PERPANJANG.includes(nilai.jasa)

  const bulanTelat = hitungBulanTelat(
    nilai.tanggalStnk,
    uraiTanggal(tanggalHariIni())!,
    tarif['denda.marginBulan'],
  )

  return (
    <>
      <Kartu judul="Kendaraan">
        <BarisIsian label="Nomor polisi" petunjuk="Huruf depan menentukan sebagian tarif jasa">
          <input
            type="text"
            value={nilai.nopol}
            placeholder="B 1234 ABC"
            autoCapitalize="characters"
            onChange={(e) => onUbah({ nopol: e.target.value.toUpperCase() })}
            aria-label="Nomor polisi"
          />
        </BarisIsian>

        <BarisIsian
          label="Jatuh tempo STNK"
          petunjuk={
            bulanTelat === null
              ? 'Keterlambatan dihitung otomatis dari tanggal ini'
              : `Terhitung ${bulanTelat} bulan terlambat, sudah termasuk margin ${tarif['denda.marginBulan']} bulan`
          }
        >
          <PilihTanggal
            label="Tanggal jatuh tempo STNK"
            nilai={nilai.tanggalStnk}
            onUbah={(iso) => onUbah({ tanggalStnk: iso })}
          />
        </BarisIsian>

        <BarisIsian label="Jenis kendaraan">
          <Segmen
            pilihan={JENIS_KENDARAAN}
            nilai={nilai.kendaraan}
            onUbah={(k: JenisKendaraan) => onUbah({ kendaraan: k })}
            ariaLabel="Jenis kendaraan"
          />
        </BarisIsian>
      </Kartu>

      <Kartu judul="Jenis Jasa">
        <BarisIsian label="Layanan yang diurus">
          <div className="pintas-jasa" role="group" aria-label="Jenis jasa">
            {JENIS_JASA.map((j) => (
              <button
                key={j}
                type="button"
                aria-pressed={nilai.jasa === j}
                onClick={() => onUbah({ jasa: j as JenisJasa })}
              >
                {j}
              </button>
            ))}
          </div>
        </BarisIsian>

        {perpanjangan && (
          <Sakelar
            label="Perpanjangan 5 tahun (ganti kaleng)"
            nilai={nilai.gantiKaleng}
            onUbah={(v) => onUbah({ gantiKaleng: v })}
          />
        )}
      </Kartu>

      <Kartu judul={perluTujuan ? 'Asal & Tujuan' : 'Lokasi'}>
        <BarisIsian label={perluTujuan ? 'Kecamatan asal' : 'Kecamatan'}>
          <PilihDaerah
            label={perluTujuan ? 'Kecamatan asal' : 'Kecamatan'}
            kecamatan={nilai.kecamatanAsal}
            samsat={nilai.samsatAsalPilihan}
            onUbah={(kec, sam) => onUbah({ kecamatanAsal: kec, samsatAsalPilihan: sam })}
          />
        </BarisIsian>

        {perluTujuan && (
          <BarisIsian label="Kecamatan tujuan">
            <PilihDaerah
              label="Kecamatan tujuan"
              kecamatan={nilai.kecamatanTujuan}
              samsat={nilai.samsatTujuanPilihan}
              onUbah={(kec, sam) => onUbah({ kecamatanTujuan: kec, samsatTujuanPilihan: sam })}
            />
          </BarisIsian>
        )}
      </Kartu>

      <Kartu judul="Pajak Kendaraan">
        <BarisIsian label="PKB" petunjuk="Sesuai yang tertera di STNK">
          <IsianRupiah
            nilai={nilai.pkb}
            onUbah={(n) => onUbah({ pkb: n })}
            ariaLabel="Pajak kendaraan bermotor"
          />
        </BarisIsian>

        <BarisIsian label="SWDKLLJ">
          <IsianRupiah
            nilai={nilai.swdkllj}
            onUbah={(n) => onUbah({ swdkllj: n })}
            ariaLabel="SWDKLLJ"
          />
        </BarisIsian>
      </Kartu>

      <Kartu judul="Pilihan Tambahan">
        <Sakelar
          label="STNK hilang"
          nilai={nilai.stnkHilang}
          onUbah={(v) => onUbah({ stnkHilang: v })}
        />
        <Sakelar
          label="Pengurusan luar kota"
          nilai={nilai.pengurusanJauh}
          onUbah={(v) => onUbah({ pengurusanJauh: v })}
        />
        <Sakelar
          label="Cadangan tilang ETLE"
          nilai={nilai.etle}
          onUbah={(v) => onUbah({ etle: v })}
        />
        <Sakelar
          label="Matikan nopol lama"
          nilai={nilai.matikanNopol}
          onUbah={(v) => onUbah({ matikanNopol: v })}
        />

        <BarisIsian label="Request nopol">
          <select
            value={nilai.requestNopol}
            onChange={(e) => onUbah({ requestNopol: e.target.value as PilihanNopol })}
            aria-label="Request nopol"
          >
            {PILIHAN_NOPOL.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </BarisIsian>
      </Kartu>

      {nilai.pengurusanJauh && (
        <Kartu judul="Biaya Perjalanan">
          <BarisIsian label="Kota asal">
            <input
              type="text"
              value={nilai.lokasiJauhAsal}
              placeholder="Jakarta"
              onChange={(e) => onUbah({ lokasiJauhAsal: e.target.value })}
              aria-label="Kota asal"
            />
          </BarisIsian>

          <BarisIsian label="Kota tujuan">
            <input
              type="text"
              value={nilai.lokasiJauhTujuan}
              placeholder="Medan"
              onChange={(e) => onUbah({ lokasiJauhTujuan: e.target.value })}
              aria-label="Kota tujuan"
            />
          </BarisIsian>

          <BarisIsian
            label="Jarak tempuh (km)"
            petunjuk={`Dihitung pulang pergi, Rp ${tarif['jauh.tarifPerKm']} per km`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={nilai.jarak || ''}
              placeholder="0"
              onChange={(e) => onUbah({ jarak: Number(e.target.value.replace(/\D/g, '')) || 0 })}
              aria-label="Jarak tempuh"
            />
          </BarisIsian>

          <BarisIsian label="Hotel">
            <IsianRupiah nilai={nilai.hotel} onUbah={(n) => onUbah({ hotel: n })} ariaLabel="Hotel" />
          </BarisIsian>

          <BarisIsian label="Tol & taksi">
            <IsianRupiah
              nilai={nilai.tolTaksi}
              onUbah={(n) => onUbah({ tolTaksi: n })}
              ariaLabel="Tol dan taksi"
            />
          </BarisIsian>

          <BarisIsian label="Makan">
            <IsianRupiah nilai={nilai.makan} onUbah={(n) => onUbah({ makan: n })} ariaLabel="Makan" />
          </BarisIsian>

          <BarisIsian label="Tiket pesawat">
            <IsianRupiah
              nilai={nilai.tiketPesawat}
              onUbah={(n) => onUbah({ tiketPesawat: n })}
              ariaLabel="Tiket pesawat"
            />
          </BarisIsian>
        </Kartu>
      )}
    </>
  )
}
