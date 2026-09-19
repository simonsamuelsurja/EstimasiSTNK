# Pola ARA (Auto Reject Atas) — IDX

Catatan pola hasil analisis data historis harian IDX, beserta screener yang
menerapkannya. Disimpan agar bisa diulang dan diuji ulang.

## Data

- Sumber: https://github.com/nofendian17/idx_dataset (scrape harian IDX, satu CSV per hari bursa)
- Rentang mentah: 2022-08-24 → 2026-09-18 (939 hari, 966 emiten, 749.920 baris)
- **Periode 2023-11 → 2024-06 DIBUANG**: cakupan emiten runtuh ke 256–442 dari ~950
  (kegagalan scraper, bukan realitas pasar). Memakainya menimbulkan bias seleksi.

Tiga blok terpisah dipakai supaya temuan diuji lintas rezim, bukan di-fit ke satu periode:

| Blok  | Periode           | Fungsi                |
|-------|-------------------|-----------------------|
| OLD   | 2022-11 → 2023-10 | out-of-sample kedua   |
| TRAIN | 2024-07 → 2025-12 | penemuan pola         |
| TEST  | 2026-01 → 2026-09 | out-of-sample utama   |

## Perlakuan data yang menentukan

1. **Return dirangkai dari `Last Price / Previous Price`.** Kolom `Previous Price` milik
   IDX sudah disesuaikan aksi korporasi (diverifikasi pada ADRO 2024-11-29, turun ke
   Rp2.080 karena spin-off AADI). Ini membuat seri return kebal stock split.
2. **Hari tanpa transaksi** (9,6% baris, harga tercatat 0) diperlakukan return 0,
   bukan −100%.
3. **Emiten dengan harga acuan < Rp50** (papan pemantauan khusus, Rp1→Rp2 = +100%)
   dikeluarkan — itu granularitas tick, bukan ARA.
4. **5 hari pertama emiten IPO baru** dikeluarkan (band ARA-nya 2x normal).

## Ambang ARA — diverifikasi empiris, bukan dari aturan yang diasumsikan

Distribusi return harian per bucket harga acuan menunjukkan puncak tajam persis di:

| Harga acuan (previous close) | ARA |
|------------------------------|-----|
| Rp50 – Rp200                 | 35% |
| Rp200 – Rp5.000              | 25% |
| > Rp5.000                    | 20% |

Realisasi sedikit di bawah angka bulat karena pembulatan tick.

**Definisi flag**: `return >= ambang − 1,5pp` DAN `close == high`.
Stabil terhadap toleransi (2.538 event pada tol 1% → 2.632 pada tol 2%).

Hasil: 2.603 hari tutup-ARA, 4.807 sentuh-ARA intraday,
**532 dari 966 emiten (55%) pernah ARA** — filter "pernah ARA" saja tidak menyaring apa pun.

## POLA 1 — ciri sebelum ARA

Base rate: P(ARA dalam 5 hari bursa) = 2,2%. Lift desil teratas:

| Ciri                          | Ambang ≈           | Lift TRAIN | Lift TEST | Status        |
|-------------------------------|--------------------|------------|-----------|---------------|
| Volatilitas 20 hari           | stdev harian >6,7% | 3,60x      | 3,01x     | replikasi     |
| Jarak di atas dasar 60 hari   | >+68%              | 2,97x      | 2,50x     | replikasi     |
| Momentum 20 hari              | >+24%              | 2,90x      | 2,22x     | replikasi (U) |
| Lonjakan volume               | >5x median 20h     | 2,47x      | 2,25x     | replikasi     |
| Di puncak 250 hari            | —                  | 2,50x      | 1,28x     | TIDAK stabil  |
| Likuiditas (Rp/hari)          | —                  | 0,61x      | 0,56x     | TERBALIK      |
| **Level harga nominal**       | —                  | **0,89x**  | **0,89x** | **nihil**     |

Ringkas: **saham sepi yang sudah bergejolak dan sudah naik banyak.**
Bukan saham murah — level harga nominal tidak memprediksi apa pun.

## POLA 2 — sesudah ARA terjadi

P(ARA lagi besok), tiga blok:

| Kondisi         | OLD   | TRAIN | TEST  |
|-----------------|-------|-------|-------|
| ARA ke-1        | 18,1% | 24,4% | 18,8% |
| ARA ke-2        | 27,0% | 38,5% | 24,3% |
| ARA ke-3+       | 36,0% | 49,0% | 33,3% |
| Gap open <= 0   |  9,7% |  5,5% |  3,9% |
| Gap open 0–5%   | 13,9% | 13,9% | 12,6% |
| Gap open 5–12%  | 27,3% | 18,5% | 18,0% |
| Gap open > 12%  | 33,3% | 53,1% | 41,7% |

Monoton naik di ketiga blok. **Gap pembukaan adalah prediktor terbaik ARA berikutnya.**

## POLA 3 — yang bisa diprediksi TIDAK bisa diuangkan

Di hari ARA harga terkunci di ceiling; entry realistis adalah open hari berikutnya.

| Blok  | n     | Gap open | +20h dari close ARA (khayalan) | +20h dari open (nyata) | Median  | P(untung) |
|-------|-------|----------|--------------------------------|------------------------|---------|-----------|
| OLD   |   459 | +5,2%    | +1,08%                         | −3,92%                 | −12,52% | 30,0%     |
| TRAIN | 1.127 | +9,5%    | +20,88%                        | +9,70%                 |  −9,09% | 37,4%     |
| TEST  |   702 | +7,5%    | −5,64%                         | −12,48%                | −19,21% | 21,6%     |

- Win rate beli-setelah-ARA: **22–37%** di setiap horizon, setiap blok.
- Dari 11 subset (likuiditas x gap x rentetan, n>=60): **0 yang median-nya positif di ketiga blok.**
- Sisi sebaliknya: bagi yang **sudah pegang**, jual di open berikutnya menang 74–84%
  (median +4,7% s/d +8,3%). ARA adalah peristiwa keluar, bukan peluang masuk.

## Jebakan overfitting yang terdeteksi

Hanya dengan TRAIN, tiga "temuan" ini terlihat meyakinkan dan semuanya **berbalik** di luar sampel:

| "Temuan" TRAIN            | TRAIN         | TEST    | OLD     |
|---------------------------|---------------|---------|---------|
| ARA ke-3 entry terbaik    | +8,2% (55% w) | −29,8%  | −15,7%  |
| ARA saham likuid lebih baik | +4,3%       | −5,0%   | —       |
| ARA di puncak 250h lebih baik | +4,8%     | −2,7%   | —       |

Backtest satu periode di kelas aset ini praktis tidak bernilai.

## Screener

`screener_ara.py` — skor komposit dari 4 faktor tervalidasi (rank cross-sectional,
rata-rata persentil): volatilitas 20h, jarak dari dasar 60h, momentum 20h, lonjakan volume.

Kalibrasi P(ARA dalam 10 bar ≈ 2 pekan) untuk N skor tertinggi:

| Periode                | Saringan        | Top 10 | Base  | Lift  |
|------------------------|-----------------|--------|-------|-------|
| TRAIN (in-sample)      | semua           | 15,94% | 3,37% | 4,73x |
| TEST (out-of-sample)   | semua           | 19,81% | 4,08% | 4,86x |
| TEST (out-of-sample)   | likuid >=Rp1 M  |  9,94% | 3,08% | 3,22x |
| OLD (out-of-sample)    | semua           |  8,73% | 1,39% | 6,29x |

## Batas yang harus diingat

- Lift ~5x dari base 4% tetap berarti **~80% kemungkinan TIDAK ARA**. Ini penyaring, bukan prediksi.
- Ciri yang sama menaikkan peluang ARB — populasinya berekor gemuk dua arah.
- Screener memprediksi ARA, dan analisis di atas menunjukkan memprediksi ARA
  **tidak menghasilkan uang** bagi pembeli. Ini alat riset, bukan sinyal beli.
- Satu sumber data, belum disilang dengan IDX resmi.
- Tidak ada data suspensi/UMA — sebagian ARA kemungkinan diikuti suspensi yang tidak terhitung.

## Cara menjalankan

```bash
git clone --depth 1 https://github.com/nofendian17/idx_dataset /tmp/idx_dataset
pip install pandas numpy pyarrow
python analisis-ara/screener_ara.py --data /tmp/idx_dataset/data --top 15
```
