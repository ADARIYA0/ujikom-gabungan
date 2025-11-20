# Panduan Testing Pembayaran QRIS di Xendit Sandbox

## ⚠️ Penting: Testing di Sandbox Mode

**QR Code QRIS di Xendit Sandbox TIDAK bisa di-scan dengan aplikasi e-wallet/mobile banking nyata (GoPay, OVO, DANA, dll).**

Ini adalah **perilaku normal** karena:
1. QR Code di sandbox adalah **simulasi** dan tidak terhubung ke sistem pembayaran real
2. Aplikasi e-wallet/mobile banking hanya bisa scan QR Code dari sistem pembayaran **production**
3. Sandbox mode hanya untuk testing alur aplikasi, bukan testing pembayaran real

## ✅ Cara Testing Pembayaran di Sandbox Mode

### Metode 1: Simulate Payment di Invoice (Recommended)

1. **Buka Invoice di Browser**
   - Setelah invoice dibuat, buka invoice URL di browser
   - Atau klik tombol "Buka Invoice di Tab Baru" di halaman pembayaran

2. **Gunakan Fitur Simulate Payment**
   - Di halaman invoice Xendit, cari tombol **"Simulate Payment"** atau **"Pay with Test Account"**
   - Klik tombol tersebut untuk mensimulasikan pembayaran berhasil
   - Status pembayaran akan otomatis berubah menjadi "PAID"

3. **Verifikasi di Aplikasi**
   - Kembali ke halaman pembayaran di aplikasi
   - Klik tombol "Periksa Status Pembayaran"
   - Status akan berubah menjadi "Pembayaran Berhasil"

### Metode 2: Xendit Dashboard

1. **Login ke Xendit Dashboard**
   - Buka https://dashboard.xendit.co
   - Login dengan akun sandbox Anda

2. **Cari Invoice**
   - Masuk ke menu **Invoices**
   - Cari invoice yang baru dibuat
   - Klik invoice untuk melihat detail

3. **Simulate Payment**
   - Di detail invoice, ada opsi untuk **simulate payment**
   - Klik untuk mensimulasikan pembayaran berhasil

### Metode 3: Webhook Testing (Untuk Testing Otomatis)

1. **Setup Webhook URL**
   - Pastikan webhook URL sudah dikonfigurasi di Xendit Dashboard
   - URL: `https://your-domain.com/api/payment/webhook`

2. **Test Webhook**
   - Di Xendit Dashboard, gunakan fitur **Webhook Testing**
   - Pilih event: `invoice.paid`
   - Kirim test webhook ke aplikasi Anda

## 🔍 Mengapa GoPay/OVO/DANA Tidak Bisa Scan QRIS Sandbox?

### Alasan Teknis:

1. **QR Code Sandbox vs Production**
   - QR Code sandbox menggunakan **merchant ID sandbox**
   - Aplikasi e-wallet hanya mengenali **merchant ID production**
   - Sistem pembayaran real tidak terhubung ke sandbox environment

2. **Keamanan**
   - Mencegah transaksi real di environment testing
   - Mencegah kebocoran data testing ke sistem production

3. **Infrastruktur Terpisah**
   - Sandbox dan Production menggunakan infrastruktur berbeda
   - Tidak ada koneksi antara sandbox dan sistem pembayaran real

## 📝 Checklist Testing

### ✅ Yang Bisa Di-test di Sandbox:
- [x] Invoice berhasil dibuat
- [x] Invoice URL bisa diakses
- [x] QR Code muncul di invoice (meskipun tidak bisa di-scan real)
- [x] Simulate payment berhasil
- [x] Status pembayaran berubah setelah simulate
- [x] Webhook menerima notifikasi
- [x] Attendance dibuat setelah pembayaran
- [x] Email token dikirim setelah pembayaran

### ❌ Yang TIDAK Bisa Di-test di Sandbox:
- [x] Scan QR Code dengan aplikasi e-wallet real
- [x] Transaksi pembayaran real
- [x] Konfirmasi pembayaran dari bank/e-wallet

## 🚀 Testing di Production

Untuk testing dengan pembayaran real:

1. **Setup Production Environment**
   - Daftar akun Xendit Production
   - Setup API keys production
   - Verifikasi merchant account

2. **Testing dengan Nominal Kecil**
   - Buat invoice dengan nominal kecil (misal: Rp 1.000)
   - Scan QR Code dengan aplikasi e-wallet
   - Lakukan pembayaran real
   - Verifikasi status berubah

3. **Refund Testing**
   - Test refund flow jika diperlukan
   - Verifikasi webhook refund

## 💡 Tips Testing

1. **Gunakan Simulate Payment**
   - Ini cara tercepat untuk test flow aplikasi
   - Tidak perlu setup payment real

2. **Test Semua Status**
   - Test payment success (simulate paid)
   - Test payment expired (tunggu atau simulate)
   - Test payment failed (simulate failed)

3. **Monitor Logs**
   - Periksa log aplikasi untuk melihat flow
   - Pastikan webhook diterima dengan benar

4. **Test Edge Cases**
   - Test dengan invoice yang expired
   - Test dengan multiple payments untuk event yang sama
   - Test dengan payment yang sudah paid

## 📞 Support

Jika ada masalah dengan testing:
1. Cek dokumentasi Xendit: https://docs.xendit.co
2. Hubungi support Xendit untuk sandbox issues
3. Periksa log aplikasi untuk error details

---

**Catatan:** Setelah aplikasi siap untuk production, pastikan untuk:
- Menggunakan API keys production
- Setup webhook URL production
- Test dengan nominal kecil terlebih dahulu
- Monitor transaksi real dengan hati-hati

