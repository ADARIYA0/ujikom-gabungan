'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PaymentService } from '@/services/paymentService';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, ArrowLeft, Calendar, Mail, Home, Search, BadgePercent, Contact } from 'lucide-react';
import { Header } from '@/components/Header';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const paymentId = searchParams.get('payment_id') ? parseInt(searchParams.get('payment_id')!, 10) : null;
  
  const [payment, setPayment] = useState<{
    paymentId: number;
    status: string;
    amount: number;
    paidAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!paymentId) {
        setError('Payment ID tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await PaymentService.getPaymentStatus(paymentId);
        
        if (result.success && result.data) {
          if (result.data.status === 'paid') {
            setPayment(result.data);
          } else {
            setError('Pembayaran belum dikonfirmasi atau status tidak valid');
          }
        } else {
          setError(result.error || result.message || 'Gagal mengambil status pembayaran');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil status pembayaran');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [paymentId]);

  const headerItems = [
    {
      name: "Beranda",
      link: "/",
      icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Cari Kegiatan",
      link: "/events",
      icon: <Search className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Harga",
      link: "/pricing",
      icon: <BadgePercent className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Tentang Kami",
      link: "/about",
      icon: <Contact className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-16 w-16 text-slate-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Memuat Status Pembayaran</h2>
              <p className="text-gray-600">Mohon tunggu sebentar...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headerItems={headerItems} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
              <p className="text-gray-600 mb-6">{error || 'Pembayaran tidak ditemukan'}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/payment')} variant="outline">
                  Kembali ke Halaman Pembayaran
                </Button>
                <Button onClick={() => router.push('/events')} className="bg-slate-600 hover:bg-slate-700">
                  Kembali ke Daftar Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="search" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Card */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
              <p className="text-gray-600 mb-6">
                Pembayaran Anda telah dikonfirmasi. Token event akan dikirim ke email Anda.
              </p>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Detail Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">ID Pembayaran</span>
                <span className="font-semibold text-gray-900">#{payment.paymentId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {payment.status === 'paid' ? 'Berhasil' : payment.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Total Pembayaran</span>
                <span className="text-xl font-bold text-gray-900">
                  {PaymentService.formatAmount(payment.amount)}
                </span>
              </div>
              {payment.paidAt && (
                <div className="flex items-center gap-2 py-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="text-gray-600">Waktu Pembayaran:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(payment.paidAt).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Jakarta'
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informasi Penting</h3>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Token event akan dikirim ke email Anda dalam beberapa saat</li>
                    <li>Pastikan email yang terdaftar aktif dan cek folder spam jika perlu</li>
                    <li>Gunakan token tersebut untuk check-in pada hari event</li>
                    <li>Anda dapat melihat daftar event yang telah didaftarkan di halaman profil</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/profile')}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
              size="lg"
            >
              Lihat Event Saya
            </Button>
            <Button
              onClick={() => router.push('/events')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-16 w-16 text-slate-600 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Memuat Halaman</h2>
        <p className="text-gray-600">Mohon tunggu sebentar...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

