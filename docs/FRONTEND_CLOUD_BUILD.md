# Build frontend SASTRA di Google Cloud

Konfigurasi ini membangun frontend demo dan memublikasikan image ke Artifact Registry. Tidak menjalankan deployment Cloud Run, mengubah IAM, mengaktifkan API, atau membuat repository secara otomatis. Backend dan dokumen lain tidak dikirim dalam arsip build frontend.

## File yang dipakai

| File                                 | Fungsi                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| frontend/Dockerfile                  | Node 24 untuk install, format check, 7 tes domain dan build; Nginx untuk runtime statis |
| frontend/.dockerignore               | Mengecualikan dependencies lokal, dist dan env/credential dari konteks Docker           |
| frontend/nginx/default.conf.template | Port dinamis dari PORT, fallback route React, cache aset dan endpoint healthz           |
| cloudbuild.yaml                      | Build linux/amd64, tag unik BUILD_ID, lalu publish image ke Artifact Registry           |
| .gcloudignore                        | Membatasi file yang diunggah oleh gcloud builds submit                                  |

Image default: `asia-southeast2-docker.pkg.dev/hackathon-primestep-02/sastra/sastra-frontend:BUILD_ID`. Build menggunakan `hackathon-runtime@hackathon-primestep-02.iam.gserviceaccount.com` dan mengirim log ke Cloud Logging. Pada build berbasis trigger, pilih service account tersebut pada konfigurasi trigger; service account di trigger mengambil prioritas atas konfigurasi file.

## 1. Uji container lokal (opsional jika Docker tersedia)

Jalankan dari root repository:

```bash
docker build --platform linux/amd64 -t sastra-frontend:local ./frontend
docker run --rm -p 127.0.0.1:8080:8080 -e PORT=8080 sastra-frontend:local
```

Buka http://127.0.0.1:8080 dan http://127.0.0.1:8080/assessment. Refresh pada route harus tetap membuka aplikasi. Endpoint `/healthz` menghasilkan `ok`. Request `/api/` sengaja mengembalikan JSON 404 karena runtime ini tidak menyediakan proxy backend. Ctrl+C menghentikan container.

## 2. Siapkan proyek lewat Cloud Shell

Cloud Shell sudah menyediakan gcloud. Login lokal tidak diperlukan jika bekerja di Cloud Shell. Pastikan proyek dan billing/kredit hackathon benar. API yang diperlukan untuk tahap build: Cloud Build dan Artifact Registry. Cloud Run API diperlukan pada tahap deploy berikutnya. Vertex AI tidak diperlukan untuk membangun frontend demo.

```bash
gcloud config set project hackathon-primestep-02
gcloud services list --enabled --project=hackathon-primestep-02
gcloud artifacts repositories list --project=hackathon-primestep-02 --location=asia-southeast2
```

Jika API build belum aktif, jalankan langkah berikut setelah memastikan sesuai pengaturan tim:

```bash
gcloud services enable cloudbuild.googleapis.com artifactregistry.googleapis.com --project=hackathon-primestep-02
```

Gunakan repository Docker `sastra` yang sudah tersedia di region pilihan tim. Jika belum ada, buat satu kali:

```bash
gcloud artifacts repositories create sastra --repository-format=docker --location=asia-southeast2 --project=hackathon-primestep-02 --description="SASTRA application images"
```

Service account build memerlukan izin push pada repository (Artifact Registry Writer) dan tulis log (Logs Writer). Pengguna yang submit build memerlukan izin membuat build dan menggunakan service account tersebut (iam.serviceAccounts.actAs). Daftar IAM yang dibagikan tim menunjukkan role terkait, tetapi konfigurasi aktual, deny policy, billing dan quota perlu dicek di proyek. Langkah di atas dan build cloud dapat menggunakan kredit/menimbulkan biaya sesuai ketentuan proyek.

## 3. Ambil branch frontend dan submit build

Untuk clone pertama di Cloud Shell:

```bash
git clone --branch feat/teacher-dashboard https://github.com/mSatashi/SASTRA.git
cd SASTRA
```

Jika checkout sudah ada, masuk ke repository tersebut lalu checkout branch dan pull pembaruan terlebih dahulu. Semua perintah submit berikut dijalankan dari root SASTRA, bukan folder frontend.

Periksa arsip sumber sebelum submit:

```bash
gcloud meta list-files-for-upload
```

Output seharusnya hanya berisi `cloudbuild.yaml` dan sumber frontend; node_modules, dist, backend, dokumen, env lokal dan credential tidak ikut.

Submit build default mode demo:

```bash
gcloud builds submit . --config=cloudbuild.yaml --project=hackathon-primestep-02 --region=asia-southeast2
```

`images` di cloudbuild.yaml memublikasikan image setelah semua langkah build berhasil; tidak perlu docker push manual. Halaman hasil build menampilkan nama image dan digest. Simpan BUILD_ID dan digest untuk tahap deployment berikutnya.

Region/repository dapat diganti melalui substitutions bila tim sudah memiliki repository lain:

```bash
gcloud builds submit . --config=cloudbuild.yaml --project=hackathon-primestep-02 --region=asia-southeast2 --substitutions=_REGION=asia-southeast2,_REPOSITORY=sastra
```

## 4. Sesudah build sukses

Periksa image di Artifact Registry, lalu gunakan image tersebut untuk membuat service Cloud Run pada langkah berikutnya. Runtime mendengarkan semua interface pada port `PORT` (default 8080); Nginx hanya melakukan substitusi PORT sehingga variabel `$uri` untuk fallback React tetap utuh. `/healthz` memeriksa server frontend, bukan kesehatan backend atau Gemini.

Frontend tetap mode demo. Untuk integrasi nanti, set `_VITE_DATA_MODE=api` dan `_VITE_API_URL` ke URL HTTPS API SASTRA yang kontraknya sudah disepakati, kemudian build image baru. Nilai Vite tertanam dalam JavaScript saat build; mengubah env Cloud Run saja tidak mengubah URL backend atau mode data. Jangan menaruh API key Gemini atau service-account JSON dalam build arg VITE_*.

Backend perlu mengizinkan origin frontend pada CORS dan menyediakan autentikasi yang sesuai jika cookie credentials digunakan. Backend `/api/v1` kini tersedia untuk prototipe satu kelas. Untuk build gabungan API + UI dengan same-origin dan Vertex ADC, gunakan `cloudbuild.app.yaml`; lihat [VERTEX_INTEGRATION.md](VERTEX_INTEGRATION.md).

## Acuan resmi

- https://docs.cloud.google.com/build/docs/build-config-file-schema
- https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts
- https://docs.cloud.google.com/sdk/gcloud/reference/topic/gcloudignore
- https://docs.cloud.google.com/run/docs/container-contract
- https://hub.docker.com/_/nginx
