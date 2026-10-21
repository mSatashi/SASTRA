# Penyimpanan cloud SASTRA

Konfigurasi target Cloud Run memakai `SASTRA_STORAGE_BACKEND=cloudsql`. Konfigurasi cloud yang tidak lengkap menghentikan startup; aplikasi tidak berpindah ke SQLite secara diam-diam. SQLite tetap tersedia untuk pengembangan lokal dan tes kontrak.

## Prasyarat IAM runtime

Service account `hackathon-runtime@hackathon-primestep-02.iam.gserviceaccount.com` memerlukan `roles/cloudsql.client`, akses objek bucket, serta Secret Manager Secret Accessor untuk secret password. Role pada akun manusia tidak diwariskan ke Cloud Run.

Owner atau administrator IAM proyek perlu menjalankan:

```sh
gcloud projects add-iam-policy-binding hackathon-primestep-02 --member="serviceAccount:hackathon-runtime@hackathon-primestep-02.iam.gserviceaccount.com" --role="roles/cloudsql.client"
```

Jika akun pelaksana tidak memiliki `resourcemanager.projects.setIamPolicy`, pembuatan database tetap dapat berhasil sedangkan pengaktifan backend terhenti pada 403 `cloudsql.instances.get`. Jangan mengalihkan trafik sebelum role runtime tersedia dan pemeriksaan revisi berhasil.

## Konfigurasi

- `GCP_SQL_INSTANCE=hackathon-primestep-02:asia-southeast2:sastra-postgres`
- `GCP_SQL_DATABASE=sastra`, `GCP_SQL_USER=sastra_app`
- `GCP_SQL_PASSWORD`: referensi Secret Manager `sastra-db-password`, bukan teks di repo/build args.
- `GCP_ASSET_BUCKET=hackathon-primestep-02-sastra-private`

Cloud SQL Connector memakai identitas service account Cloud Run (Cloud SQL Client), koneksi terenkripsi, refresh LAZY dan pool maksimal 3 koneksi per proses. Instance menerima koneksi melalui Connector; tidak ada allowlist jaringan publik. Pengguna PostgreSQL aplikasi memiliki database aplikasi, tanpa role cloudsqlsuperuser.

Bucket memakai uniform bucket access dan public access prevention. Foto tidak memiliki URL publik; endpoint aset yang sudah dilindungi sesi mengirimkan berkas setelah membaca metadata dari database. Nama objek memakai ID submission, bukan nama berkas pengguna. Generation dan SHA-256 disimpan bersama metadata serta dicek saat unduh.

## Transaksi dan cakupan

Data workspace memakai satu dokumen JSONB PostgreSQL agar kontrak API saat ini tetap sama. `SELECT ... FOR UPDATE` menserialkan pembaruan dari beberapa instance; validasi versi tetap mencegah persetujuan atas versi lama. Ini cocok untuk workspace prototipe bersama. Normalisasi tabel dan isolasi per guru/sekolah diperlukan ketika autentikasi banyak guru dibangun.

Unggah objek terjadi sebelum transaksi database. Jika GCS gagal, nilai tidak disimpan. Jika transaksi gagal setelah unggah, objek tanpa referensi mungkin tertinggal. Aplikasi sengaja tidak menghapus objek pada kegagalan COMMIT yang ambigu, untuk mencegah hilangnya bukti yang sebenarnya sudah tersimpan. Pembersihan objek tanpa referensi perlu dilakukan dengan membandingkan database terlebih dahulu.

## Migrasi

1. Cadangkan `/api/v1/dashboard` dan setiap `/api/v1/submissions/{id}/asset` melalui sesi sah. Simpan `workspace.json`, `assets.json` (id, mime, sha256), dan `<id>.asset` di direktori privat. Simpan salinan pada prefix backup bucket privat.
2. Siapkan database tujuan kosong. Jalankan dengan ADC dan variabel cloud di atas:
   `python -m backend.app.migrate_workspace --snapshot-dir PATH_BACKUP`
3. Import menolak tujuan yang sudah berisi data dan memverifikasi checksum setiap berkas serta kesamaan data setelah import. Tidak tersedia endpoint migrasi publik.
4. Pastikan sumber SQLite belum berubah sejak cadangan. Deploy revisi cloud tanpa trafik utama; periksa data dan foto melalui URL revisi, lalu alihkan trafik.
5. Buat revisi Cloud Run baru lagi dan pastikan ID, versi nilai, narasi, dan checksum foto tetap sama.

Backup SQL dijadwalkan setiap hari, 7 backup disimpan; PITR belum diaktifkan. Instance zonal `db-f1-micro`, disk SSD 10 GB dengan batas pembesaran otomatis 20 GB, memakai biaya Cloud SQL terpisah dari Cloud Run. Konfigurasi ini untuk prototipe; belum menyediakan high availability atau pemulihan lintas region.

## Verifikasi

Tes kontrak lokal: `python -m unittest backend.tests.test_workspace`.

Tes PostgreSQL/GCS nyata (opt-in): `python -m unittest backend.tests.test_cloud_persistence`. Memerlukan ADC, konfigurasi cloud, dan `SASTRA_CLOUD_TEST_DATABASE` dengan nama berakhiran `_test`; dilarang memakai database aplikasi. Menguji row lock, rollback, kegagalan unggah, bukti byte-identik dan pembukaan koneksi baru. Objek tes tetap privat pada prefix `validation/` untuk diagnosis.
