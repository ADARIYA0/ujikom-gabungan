'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePayment } from '@/hooks/usePayment';
import { PaymentService } from '@/services/paymentService';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock, QrCode, ExternalLink, ArrowLeft, Calendar, MapPin, Users, Home, Search, BadgePercent, Contact } from 'lucide-react';
import { Header } from '@/components/Header';
import { EventService } from '@/services/eventService';

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const attendanceId = searchParams.get('attendance_id') ? parseInt(searchParams.get('attendance_id')!, 10) : null;
  const eventId = searchParams.get('event_id') ? parseInt(searchParams.get('event_id')!, 10) : null;
  const paymentIdParam = searchParams.get('payment_id') ? parseInt(searchParams.get('payment_id')!, 10) : null;
  
  const { payment, status, isCreating, isChecking, error, createPayment, checkPaymentStatus } = usePayment(attendanceId, eventId);
  const { event, loading: eventLoading } = useEvent(eventId || 0);
  const paymentCreatedRef = useRef(false);
  const [paymentStatus, setPaymentStatus] = useState<{ paymentId: number; status: string; amount: number; invoiceUrl: string | null; qrCodeUrl: string | null; paidAt: string | null; expiresAt: string | null } | null>(null);
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState(false);

  // Calculate payment status variables early (before useEffects that use them)
  const currentPayment = paymentStatus || status || payment;
  const isPaid = currentPayment?.status === 'paid';
  const isPending = currentPayment?.status === 'pending';
  const isExpired = currentPayment?.status === 'expired' || currentPayment?.status === 'failed';

  // Load payment status if payment_id is provided
  useEffect(() => {
    if (paymentIdParam && !paymentStatus && !isLoadingPaymentStatus) {
      setIsLoadingPaymentStatus(true);
      PaymentService.getPaymentStatus(paymentIdParam)
        .then((result) => {
          if (result.success && result.data) {
            setPaymentStatus(result.data);
            // If we have payment data, try to get event info
            if (result.data && eventId === null) {
              // We might need to get event_id from payment, but for now we'll use what we have
            }
          } else {
            toast({
              variant: 'error',
              title: 'Gagal Memuat Pembayaran',
              description: result.message || 'Tidak dapat memuat data pembayaran.',
            });
          }
        })
        .catch((err) => {
          toast({
            variant: 'error',
            title: 'Terjadi Kesalahan',
            description: 'Gagal memuat status pembayaran. Silakan coba lagi.',
          });
        })
        .finally(() => {
          setIsLoadingPaymentStatus(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIdParam]);

  // Create payment when component mounts (only once) - but not if payment_id is provided
  useEffect(() => {
    if (!paymentIdParam && (attendanceId || eventId) && !payment && !isCreating && !paymentCreatedRef.current) {
      paymentCreatedRef.current = true;
      createPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceId, eventId, paymentIdParam]);

  const headerItems = [
    {
      name: "Beranda",
      link: "/",
      icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Tentang Kami",
      link: "/#about",
      icon: <Contact className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Harga",
      link: "/#pricing",
      icon: <BadgePercent className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Cari Kegiatan",
      link: "/events",
      icon: <Search className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
  ];

  // Validation: Check if eventId, attendanceId, or paymentId exists
  if (!attendanceId && !eventId && !paymentIdParam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Tidak Valid</h2>
              <p className="text-gray-600 mb-6">
                Event ID atau Attendance ID tidak ditemukan. Silakan daftar ulang untuk event.
              </p>
              <Button onClick={() => router.push('/events')}>
                Kembali ke Daftar Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state while loading payment status or creating payment
  if (isLoadingPaymentStatus || (isCreating && !paymentIdParam)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-16 w-16 text-slate-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mempersiapkan Pembayaran</h2>
              <p className="text-gray-600">Mohon tunggu sebentar...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state when payment creation fails
  if (error && !payment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gagal Membuat Pembayaran</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/events')}>
                Kembali ke Daftar Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If payment is paid, show success message
  if (isPaid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-gray-600 mb-6">
                  Pembayaran Anda telah dikonfirmasi. Token event akan dikirim ke email Anda.
                </p>
                <Button onClick={() => router.push('/profile')} className="bg-slate-600 hover:bg-slate-700">
                  Lihat Event Saya
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If payment is expired, show error message
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Kedaluwarsa</h2>
                <p className="text-gray-600 mb-6">
                  Waktu pembayaran telah habis. Silakan daftar ulang untuk event.
                </p>
                <Button onClick={() => router.push('/events')} className="bg-slate-600 hover:bg-slate-700">
                  Kembali ke Daftar Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main payment page - show QRIS payment
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="search" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/events')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Event
          </Button>

          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembayaran Event</h1>
            <p className="text-gray-600">Selesaikan pembayaran untuk menyelesaikan pendaftaran event</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Event Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Detail Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventLoading ? (
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : event ? (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.judul_kegiatan}</h3>
                        {event.deskripsi_kegiatan && (
                          <p className="text-sm text-gray-600 line-clamp-3">{event.deskripsi_kegiatan}</p>
                        )}
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-slate-600" />
                          <span>{EventService.formatEventDate(event.waktu_mulai)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-slate-600" />
                          <span>{EventService.formatEventTime(event.waktu_mulai)} WIB</span>
                        </div>
                        {event.lokasi_kegiatan && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-slate-600" />
                            <span>{event.lokasi_kegiatan}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-slate-600" />
                          <span>Kapasitas: {event.kapasitas_peserta} peserta</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Memuat informasi event...</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Ringkasan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Pembayaran</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {currentPayment?.amount ? PaymentService.formatAmount(currentPayment.amount) : 'Rp 0'}
                    </span>
                  </div>
                  {currentPayment?.expiresAt && isPending && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Batas Waktu:</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {new Date(currentPayment.expiresAt).toLocaleString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Jakarta'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Payment Method - Invoice Embed */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-slate-600" />
                    Invoice Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Invoice Embed */}
                  {isPending && currentPayment?.invoiceUrl ? (
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-slate-600 rounded-lg">
                            <QrCode className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Pembayaran QRIS</h3>
                            <p className="text-sm text-gray-600">Scan QR Code di invoice untuk pembayaran</p>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Link - Xendit blocks iframe embedding */}
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white p-8 text-center">
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div className="p-4 bg-slate-100 rounded-full">
                              <QrCode className="h-12 w-12 text-slate-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Invoice Pembayaran QRIS
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Invoice tidak dapat ditampilkan di halaman ini karena keamanan. 
                              Silakan buka invoice di tab baru untuk melihat QR Code QRIS dan melakukan pembayaran.
                            </p>
                          </div>
                          <Button
                            onClick={() => window.open(currentPayment.invoiceUrl!, '_blank')}
                            className="w-full bg-slate-600 hover:bg-slate-700 text-white"
                            size="lg"
                          >
                            <ExternalLink className="h-5 w-5 mr-2" />
                            Buka Invoice di Tab Baru
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Setelah membuka invoice, scan QR Code QRIS menggunakan aplikasi e-wallet atau mobile banking Anda
                          </p>
                        </div>
                      </div>

                      {isChecking && (
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memeriksa status pembayaran...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-gray-500">Memuat invoice pembayaran...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Status */}
              {isPending && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Menunggu Pembayaran</p>
                        <p className="text-xs text-yellow-700">
                          Setelah melakukan pembayaran atau simulate payment di invoice, klik tombol "Periksa Status Pembayaran" untuk memverifikasi status pembayaran Anda.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manual Check Button */}
              {isPending && (
                <Button
                  onClick={async () => {
                    if (payment?.paymentId) {
                      const result = await checkPaymentStatus(payment.paymentId);
                      if (result.success && result.data) {
                        if (result.data.status === 'paid') {
                          toast({
                            variant: 'success',
                            title: 'Pembayaran Berhasil!',
                            description: 'Pembayaran Anda telah dikonfirmasi. Token event akan dikirim ke email Anda.',
                          });
                          // Redirect to success page after 2 seconds
                          setTimeout(() => {
                            router.push(`/payment/success?payment_id=${payment.paymentId}`);
                          }, 2000);
                        } else if (result.data.status === 'expired' || result.data.status === 'failed') {
                          toast({
                            variant: 'error',
                            title: 'Pembayaran Gagal',
                            description: 'Pembayaran telah kedaluwarsa atau gagal. Silakan coba lagi.',
                          });
                        } else {
                          toast({
                            variant: 'info',
                            title: 'Status Pembayaran',
                            description: 'Pembayaran masih menunggu. Silakan selesaikan pembayaran Anda.',
                          });
                        }
                      }
                    }
                  }}
                  disabled={isChecking}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Periksa Status Pembayaran
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Cara Pembayaran:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Lihat invoice pembayaran di atas (atau buka di tab baru jika lebih nyaman)</li>
                <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
                <li>Pilih menu Scan QR Code atau QRIS</li>
                <li>Scan QR Code QRIS yang ditampilkan di invoice</li>
                <li>Periksa detail pembayaran dan konfirmasi</li>
                <li>Setelah melakukan pembayaran, klik tombol "Periksa Status Pembayaran" untuk memverifikasi pembayaran Anda</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PaymentPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-16 w-16 text-slate-600 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Memuat Halaman Pembayaran</h2>
        <p className="text-gray-600">Mohon tunggu sebentar...</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentPageLoading />}>
      <PaymentPageContent />
    </Suspense>
  );
}
