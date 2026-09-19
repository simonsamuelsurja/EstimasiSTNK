# Rencana Pembangunan Aplikasi Estimasi STNK

Dokumen ini menjawab satu pertanyaan: **seberapa lama sampai aplikasi ini bisa dipakai?**

Sumber: `Surya Jasa - Estimasi v2.xlsx` (5 sheet, sudah dibedah penuh).
Target: aplikasi **Android**, pemakaian **internal**, **tarif bisa diedit admin** tanpa ngoding.

---

## Jawaban singkat

| Milestone | Isi | Perkiraan |
|---|---|---|
| **M1 — Data & logika beres** | Semua tabel harga terekstrak, semua rumus terterjemahkan, mesin hitung lulus uji terhadap Excel | **±1 minggu** |
| **M2 — Kalkulator jalan di HP** | Bisa input kendaraan, keluar estimasi, hasilnya sama persis dengan Excel | **±2–3 minggu** |
| **M3 — Siap dipakai tim** | Halaman admin tarif, override manual, kirim estimasi ke klien | **±4–6 minggu** |

Angka ini mengasumsikan kita bekerja rutin dan pertanyaan terbuka dijawab dalam 1–2 hari.
Penyebab geser paling besar bukan koding — lihat bagian [Risiko](#risiko-yang-bisa-menggeser-jadwal).

---

## Batasan environment (memengaruhi jadwal)

Sesi Claude Code ini jalan di container dengan network policy terbatas. Hasil pengecekan:

| Host | Status | Dampak |
|---|---|---|
| `dl.google.com` | **Diblokir** (403) | Android SDK tidak bisa diunduh; repo Maven `google()` untuk AndroidX/Compose tidak terjangkau |
| `expo.dev`, `api.expo.dev` | **Diblokir** (403) | Jalur Expo/EAS tertutup |
| `repo.maven.apache.org` | OK | Modul Kotlin murni bisa dibangun & diuji di sini |
| `services.gradle.org`, `registry.npmjs.org` | OK | Gradle & npm berfungsi |
| JDK 21, Gradle 8.14.3, Node 22, Python 3.11 | Terpasang | — |

**Konsekuensi:** kode Android (UI) harus dikompilasi di Android Studio di komputer Simon.
Setiap iterasi UI jadi dua langkah: Claude menulis → Simon kompilasi → error dilaporkan → Claude perbaiki.

**Mitigasi arsitektur:** proyek dipecah dua modul —

- `:core` — Kotlin/JVM murni, tanpa dependensi Android. Semua rumus dan tarif ada di sini.
  **Bisa dibangun dan diuji penuh di container ini.** Ini bagian yang paling rawan salah, jadi justru bagian inilah yang harus bisa diuji otomatis.
- `:app` — UI Android (Compose), tipis, hanya menampilkan hasil dari `:core`.
  Dikompilasi di Android Studio.

> Kelayakan pemisahan ini perlu dibuktikan di awal Fase 2 (±30 menit). Kalau ternyata gagal,
> seluruh verifikasi pindah ke komputer Simon dan **timeline M2 & M3 mundur ±1 minggu.**

Alternatif yang menghapus batasan ini sepenuhnya: membangunnya sebagai **web app yang dipasang di layar utama HP (PWA)**.
Bisa dibangun *dan* diuji end-to-end di sini, tanpa Android Studio, tanpa putaran bolak-balik — perkiraan M3 turun ke **±2–3 minggu**.
Simon sudah memilih Android; opsi ini dicatat sebagai bahan pertimbangan, bukan untuk mengubah keputusan.

---

## Tahapan

### Fase 0 — Ekstraksi & pembersihan data

Memindahkan semua data referensi dari Excel ke format terstruktur yang bisa dibaca aplikasi.

Isi:
- 140 kecamatan → Samsat
- 27 Samsat → flag Jabodetabek
- ±150 pasangan rute (Dari → Ke) × 4 kolom harga (Balik Nama Mobil/Motor, Pindah Alamat Mobil/Motor)
- Tabel Perpanjang Tahunan (Kendaraan × Samsat)
- Tabel Perpanjang ACC KTP (Kendaraan × 5 Tahun × Samsat)
- **Mengangkat 30 tarif yang selama ini tertanam di dalam rumus** menjadi baris tabel tarif

Keluaran: berkas data terstruktur + daftar 30 tarif untuk dikonfirmasi Simon.

| | |
|---|---|
| Kerja Claude | 2–3 jam |
| Butuh dari Simon | Verifikasi 30 tarif masih berlaku (±1–2 jam) |
| Bisa diverifikasi di sini | Ya, penuh |

---

### Fase 1 — Spesifikasi logika hitung

Menerjemahkan 22 rumus keluaran + 17 rumus helper menjadi aturan yang tidak ambigu.
Ini fase yang menentukan benar-salahnya seluruh aplikasi.

Isi:
- Aturan per jenis jasa (8 jenis: BBN, Mutasi, Perpanjang, Perpanjang ACC KTP, Pindah Alamat, STNK Hilang, Revisi Nopol Ganti Buku, Revisi Nopol Tidak Ganti Buku)
- 5 kelompok subtotal dan isinya
- Tabel keputusan untuk rumus bercabang dalam (`B38 Biaya Penulisan` punya 17 `IF` bersarang)
- Penyelesaian semua [pertanyaan terbuka](#pertanyaan-terbuka)

Keluaran: dokumen spesifikasi yang bisa dibaca orang non-teknis dan dipakai sebagai rujukan saat ada sengketa angka.

| | |
|---|---|
| Kerja Claude | 3–4 jam |
| Butuh dari Simon | Menjawab 12 pertanyaan terbuka — **ini penentu jadwal** |
| Bisa diverifikasi di sini | Ya |

---

### Fase 2 — Mesin hitung + pengujian

Menulis modul `:core` dan mengujinya terhadap Excel.

Isi:
- Implementasi seluruh aturan Fase 1 dalam Kotlin murni
- Tabel tarif dimuat dari data, bukan ditanam di kode
- **Uji regresi**: setiap kasus diuji terhadap angka yang sudah ada di Excel — hasil aplikasi wajib sama persis
- Kasus awal: 3 sheet kalkulator yang ada (Mutasi Cianjur→Jakarta 21.108.000, Perpanjang ACC KTP, STNK Hilang) + kasus tambahan per jenis jasa

| | |
|---|---|
| Kerja Claude | 6–8 jam |
| Butuh dari Simon | 3–5 contoh estimasi nyata beserta hasil yang benar, untuk jenis jasa yang belum tercakup |
| Bisa diverifikasi di sini | Ya — ini alasan `:core` dipisah |

**Fase ini adalah pelindung utama proyek.** Kalau mesin hitungnya benar dan teruji, sisanya hanya tampilan.

---

### Fase 3 — Aplikasi Android: input & hasil

UI untuk membuat estimasi.

Isi:
- Form input dengan field yang muncul/hilang sesuai jenis jasa yang dipilih
- Pencarian kecamatan (140 baris — tidak boleh dropdown polos)
- Tanggal STNK sebagai pemilih tanggal, bulan keterlambatan **dihitung otomatis**
- Tampilan hasil: 5 kelompok subtotal + total estimasi
- Database lokal (Room) berisi data Fase 0

| | |
|---|---|
| Kerja Claude | 8–12 jam |
| Butuh dari Simon | 2–4 putaran kompilasi di Android Studio + masukan tampilan |
| Bisa diverifikasi di sini | **Tidak** — harus dikompilasi Simon |

---

### Fase 4 — Halaman admin tarif

Yang membuat aplikasi ini tidak bergantung pada Claude untuk setiap perubahan harga.

Isi:
- Ubah 30 tarif dasar
- Kelola tabel harga rute, Samsat, kecamatan
- **Mode override manual** — setiap baris estimasi bisa ditimpa sesuai kebutuhan klien, menggantikan fungsi sheet `Hitung Manual`
- Impor/ekspor untuk pembaruan massal
- Riwayat perubahan tarif (siapa mengubah apa, kapan)

| | |
|---|---|
| Kerja Claude | 6–8 jam |
| Butuh dari Simon | Putaran kompilasi + keputusan siapa yang berhak jadi admin |
| Bisa diverifikasi di sini | Sebagian (logikanya ya, UI tidak) |

---

### Fase 5 — Keluaran untuk klien

Sesuai fungsi `B4` di Excel sekarang: data untuk disalin dan dikirim ke klien.

Isi:
- Format estimasi yang rapi (nopol, tanggal STNK, rincian, total)
- Bagikan sebagai teks WhatsApp / PDF
- Simpan riwayat estimasi

| | |
|---|---|
| Kerja Claude | 2–3 jam |
| Butuh dari Simon | Contoh format penawaran yang biasa dikirim ke klien |

---

### Fase 6 — Uji lapangan & rilis

Isi:
- Build APK di Android Studio
- Uji paralel: setiap estimasi dikerjakan di aplikasi **dan** di Excel selama 1–2 minggu, selisih apa pun ditelusuri
- Pasang di HP tim

| | |
|---|---|
| Kerja Claude | Perbaikan sesuai temuan |
| Butuh dari Simon | **Ini fase milik Simon** — 1–2 minggu pemakaian nyata |

Uji paralel tidak boleh dilewati. Aplikasi ini menghasilkan angka yang ditagihkan ke klien;
salah satu tarif saja bisa berarti kerugian atau penawaran yang tidak masuk akal.

---

## Pertanyaan terbuka

Harus dijawab di Fase 1. Tanpa ini, mesin hitung tidak bisa ditulis dengan benar.

| # | Pertanyaan | Kenapa penting |
|---|---|---|
| 1 | Bulan keterlambatan dihitung **bulan penuh** atau **bulan berjalan** (lewat 1 hari = 1 bulan)? | Menentukan `SKP` dan `JR`; selisihnya bisa jutaan |
| 2 | `Kertas Gesek` sekarang membaca *nilai* `Cek Fisik` (`if(H14=450000,45000,...)`). Aturan sebenarnya apa? | Begitu tarif cek fisik naik, kertas gesek diam-diam jadi 0 |
| 3 | Apakah 30 tarif yang tertanam di rumus masih berlaku semua? | Sumber kebenaran tarif |
| 4 | `Jasa Jauh` di-hardcode 7 juta, sementara tabel `K3:N11` punya rincian per tujuan. Mana yang benar? | Menentukan apakah tabel itu jadi lookup resmi |
| 5 | Daftar pilihan `Request Nopol` sudah lengkap? (3/2/1 Angka Ada Huruf, Ganjil/Genap) | Kelengkapan dropdown |
| 6 | Plat selain B, A, F, D perlu didukung? | Sekarang plat tak dikenal menghasilkan teks `"MANUAL"` |
| 7 | `Pickup` dihargai sama dengan `Mobil` untuk lookup, tapi `JR` ditambah 72.000. Benar? | Perlakuan jenis kendaraan |
| 8 | Perilaku pilihan `"Lainnya"` di daftar kecamatan? | Penanganan daerah di luar daftar |
| 9 | Angka `48%` di `SKP 1 BULAN` itu denda apa, dan apakah bisa berubah? | Kalau bisa berubah, harus masuk tabel tarif |
| 10 | Baris mana saja yang boleh ditimpa manual di mode override? | Menentukan desain Fase 4 |
| 11 | Estimasi perlu disimpan jadi riwayat, atau sekali pakai? | Menentukan skema database |
| 12 | Berapa orang yang akan pakai, dan apakah tarif harus tersinkron antar HP? | **Penentu besar**: kalau harus sinkron, butuh server — tambah 1–2 minggu |

Pertanyaan **12** yang paling berdampak ke jadwal. Kalau tarif cukup disimpan di masing-masing HP,
tidak perlu server sama sekali dan estimasi di atas berlaku. Kalau harus tersinkron antar HP,
tambahkan backend dan **geser M3 ke ±6–8 minggu**.

---

## Risiko yang bisa menggeser jadwal

Diurutkan dari yang paling mungkin terjadi:

1. **Menunggu jawaban pertanyaan terbuka.** Fase 2 tidak bisa jalan sebelum Fase 1 tuntas.
   Ini historisnya penyebab keterlambatan terbesar di proyek seperti ini, bukan kodingnya.
2. **Iterasi UI yang buta.** Claude tidak bisa mengkompilasi Android di sini. Setiap error kompilasi
   butuh satu putaran bolak-balik. Perkirakan 2–4 putaran per fase UI.
3. **Tarif ternyata tidak seragam.** Excel sudah terbukti punya versi yang berbeda antar sheet
   (biaya per km `6850` vs `7000`). Kemungkinan ada perbedaan lain yang baru ketahuan saat uji paralel.
4. **Kebutuhan sinkronisasi antar HP muncul belakangan.** Kalau baru ketahuan setelah Fase 4,
   sebagian Fase 4 harus ditulis ulang.
5. **Aturan Samsat berubah di tengah jalan.** Di luar kendali; mitigasinya adalah halaman admin tarif (Fase 4).

---

## Catatan koreksi dari Simon

Hasil pembacaan awal Excel sudah dikoreksi. Yang berlaku:

| Temuan | Status |
|---|---|
| `B13 Pemutihan` tidak dipakai rumus mana pun | **Dihapus** — tidak dibawa ke aplikasi |
| `B4` (tanggal STNK) hanya untuk tampilan / disalin ke klien | Benar. Di aplikasi, bulan keterlambatan **dihitung otomatis** dari tanggal ini |
| Biaya per km: `6850` vs `7000` | **`7000/10` yang terbaru** — dipakai |
| Tabel `K3:N11` (Asal/Tujuan/Jasa/Akom) tidak terhubung rumus | Memang catatan manual untuk memperbaiki tabel harga. Dicatat, lihat pertanyaan #4 |
| `Hitung Manual` dikira sheet rusak | **Salah baca.** Itu memang mode manual — sel sengaja tidak dikunci agar bisa disesuaikan per klien. Jadi fitur **override manual** di Fase 4 |
| `B26`/`B27` tidak dipakai | **Terkonfirmasi tidak dipakai** — sudah diverifikasi sampai ke XML mentah; tidak ada satu pun rumus yang membacanya. Tidak dibawa ke aplikasi |
| `B43` pakai range tetap `D2:E141` | Benar, seharusnya kolom penuh. Tidak relevan lagi di aplikasi |

Temuan tambahan (tidak mendesak): 4 *defined name* di workbook rusak (`#REF!`),
termasuk `HargaBalikNama` yang rusak di semua scope. Tidak berdampak karena rumus memakai
referensi kolom langsung, tapi menjelaskan kenapa rumusnya tidak memakai nama range.
