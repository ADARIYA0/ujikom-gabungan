'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Ticket, 
  Award, 
  ArrowLeft,
  Edit,
  CheckCircle,
  Clock,
  MapPin,
  LogOut,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Download,
  Home,
  Search,
  BadgePercent,
  Contact
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EventService } from '@/services/eventService';
import { PaymentService } from '@/services/paymentService';
import { useMyEvents, useEventHistory, usePendingPayments } from '@/hooks/useUserEvents';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'history' | 'certificates' | 'payments'>('profile');
  
  const { events: myEvents, loading: eventsLoading, refetch: refetchEvents } = useMyEvents();
  const { events: eventHistory, loading: historyLoading, refetch: refetchHistory } = useEventHistory();
  const { payments: pendingPayments, loading: paymentsLoading, refetch: refetchPayments } = usePendingPayments();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  // Don't render if not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Calculate statistics - ensure arrays
  const registeredCount = Array.isArray(myEvents) ? myEvents.length : 0;
  const completedCount = Array.isArray(eventHistory) ? eventHistory.length : 0;
  const pendingPaymentsCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;
  const certificates = [];

  const handleBack = () => {
    router.back();
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header headerItems={headerItems} />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>

          {/* Profile Header */}
          <div className="mb-8">
            <Card className="border-0 shadow-large overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-slate-600 p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {user?.name || 'User'}
                    </h1>
                    <p className="text-slate-100 mb-4">{user?.email || ''}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        Member Aktif
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {registeredCount} Event Terdaftar
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profil Saya
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'events'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Event Saya
                {registeredCount > 0 && (
                  <Badge className="ml-2 bg-primary text-white text-xs">
                    {registeredCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'history'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Riwayat Kegiatan
                {completedCount > 0 && (
                  <Badge className="ml-2 bg-primary text-white text-xs">
                    {completedCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'certificates'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sertifikat
                {certificates.length > 0 && (
                  <Badge className="ml-2 bg-primary text-white text-xs">
                    {certificates.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'payments'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pembayaran
                {pendingPaymentsCount > 0 && (
                  <Badge className="ml-2 bg-amber-500 text-white text-xs">
                    {pendingPaymentsCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'profile' && (
                <>
                  {/* Personal Information */}
                  <Card className="border-0 shadow-medium">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xl">Informasi Pribadi</CardTitle>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600">Nama Lengkap</label>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                            <span className="text-gray-900 font-medium">{user?.name || '-'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="h-5 w-5 text-primary" />
                            <span className="text-gray-900 font-medium">{user?.email || '-'}</span>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Role</label>
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Badge className="bg-primary text-white">
                            {user?.role === 'admin' ? 'Administrator' : 'User'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <Card className="border-0 shadow-medium">
                    <CardHeader>
                      <CardTitle className="text-xl">Statistik</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3 mb-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-gray-600">Event Terdaftar</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{registeredCount}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Event Selesai</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-3 mb-2">
                            <Award className="h-5 w-5 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-600">Sertifikat</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Event Saya</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchEvents()}
                      disabled={eventsLoading}
                    >
                      {eventsLoading ? 'Memuat...' : 'Refresh'}
                    </Button>
                  </div>
                  {eventsLoading ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat event...</p>
                      </CardContent>
                    </Card>
                  ) : !Array.isArray(myEvents) || myEvents.length === 0 ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold text-gray-600 mb-2">
                          Belum Ada Event Terdaftar
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                          Daftarkan diri Anda untuk event yang menarik!
                        </p>
                        <Button onClick={() => router.push('/events')}>
                          Cari Event
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    (Array.isArray(myEvents) ? myEvents : []).map((event) => {
                      const isCheckedIn = event.attendance_status === 'hadir';
                      const canCheckIn = event.is_event_started && !event.is_event_passed && !isCheckedIn;
                      
                      return (
                        <Card key={event.id} className="border-0 shadow-medium hover:shadow-large transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                      {event.judul_kegiatan}
                                    </h3>
                                    <Badge className={`${EventService.getCategoryColor(event.kategori?.nama_kategori || '')} border`}>
                                      {event.kategori?.nama_kategori || 'Umum'}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge className={`${
                                      isCheckedIn 
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                        : 'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                      {isCheckedIn ? 'Sudah Hadir' : 'Terdaftar'}
                                    </Badge>
                                    {!isCheckedIn && event.is_event_passed && (
                                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
                                        Belum Isi Kehadiran
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="font-medium text-gray-700">
                                      {EventService.formatEventDate(event.waktu_mulai)}
                                      {EventService.isSameDay(event.waktu_mulai, event.waktu_berakhir) && (
                                        <span className="ml-2 text-gray-500">
                                          • Selesai: {EventService.formatEventTime(event.waktu_berakhir)} WIB
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="font-medium text-gray-700">
                                      {EventService.formatEventTime(event.waktu_mulai)} WIB
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="font-medium text-gray-700">
                                      {event.lokasi_kegiatan}
                                    </span>
                                  </div>
                                  {isCheckedIn && event.waktu_absen && (
                                    <div className="flex items-center text-sm text-emerald-600 mt-2">
                                      <CheckCircle2 className="h-4 w-4 mr-3 flex-shrink-0" />
                                      <span className="font-medium">
                                        Hadir pada {new Date(event.waktu_absen).toLocaleString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} WIB
                                      </span>
                                    </div>
                                  )}
                                  {!isCheckedIn && canCheckIn && (
                                    <div className="flex items-center text-sm text-amber-600 mt-2">
                                      <Clock className="h-4 w-4 mr-3 flex-shrink-0" />
                                      <span className="font-medium">
                                        Belum isi daftar hadir - Event sudah dimulai
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 md:justify-center">
                                <Button
                                  onClick={() => router.push(`/events/${event.slug}`)}
                                  variant="outline"
                                  className="w-full md:w-auto"
                                >
                                  Lihat Detail
                                </Button>
                                {canCheckIn && (
                                  <Button
                                    onClick={() => router.push(`/events/${event.slug}`)}
                                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Isi Daftar Hadir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Riwayat Kegiatan</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchHistory()}
                      disabled={historyLoading}
                    >
                      {historyLoading ? 'Memuat...' : 'Refresh'}
                    </Button>
                  </div>
                  {historyLoading ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat riwayat...</p>
                      </CardContent>
                    </Card>
                  ) : !Array.isArray(eventHistory) || eventHistory.length === 0 ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold text-gray-600 mb-2">
                          Belum Ada Riwayat Kegiatan
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                          Riwayat kegiatan akan muncul setelah Anda menyelesaikan event
                        </p>
                        <Button onClick={() => router.push('/events')}>
                          Cari Event
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    (Array.isArray(eventHistory) ? eventHistory : []).map((event: any) => {
                      // Check if user attended - if waktu_absen exists, user has attended
                      // User can download certificate if they attended (hadir)
                      // Certificate can be generated from event template or default template
                      const hasAttended = event.attendance_status === 'hadir' || !!event.waktu_absen;
                      // Get attendance_id from event (backend returns it as attendance_id)
                      const attendanceId = event.attendance_id || event.attendanceId || (event as any).attendance_id;
                      // Show download button if user attended (attendance_id will be used in the download request)
                      // Certificate can be generated even without event-specific template (uses default template)
                      const canDownloadCertificate = hasAttended;
                      
                      
                      return (
                        <Card key={event.id} className="border-0 shadow-medium hover:shadow-large transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                      {event.judul_kegiatan}
                                    </h3>
                                    <Badge className={`${EventService.getCategoryColor(event.kategori?.nama_kategori || '')} border`}>
                                      {event.kategori?.nama_kategori || 'Umum'}
                                    </Badge>
                                  </div>
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Selesai
                                  </Badge>
                                </div>
                                <div className="space-y-2 mt-4">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="font-medium text-gray-700">
                                      {EventService.isSameDay(event.waktu_mulai, event.waktu_berakhir) ? (
                                        <>
                                          {EventService.formatEventDate(event.waktu_mulai)}
                                          <span className="ml-2 text-gray-500">
                                            ({EventService.formatEventTime(event.waktu_mulai)} - {EventService.formatEventTime(event.waktu_berakhir)} WIB)
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          {EventService.formatEventDate(event.waktu_mulai)} - {EventService.formatEventDate(event.waktu_berakhir)}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="font-medium text-gray-700">
                                      {event.lokasi_kegiatan}
                                    </span>
                                  </div>
                                  {event.waktu_absen && (
                                    <div className="flex items-center text-sm text-emerald-600 mt-2">
                                      <CheckCircle2 className="h-4 w-4 mr-3 flex-shrink-0" />
                                      <span className="font-medium">
                                        Hadir pada {new Date(event.waktu_absen).toLocaleString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} WIB
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 md:justify-center">
                                <Button
                                  onClick={() => router.push(`/events/${event.slug}`)}
                                  variant="outline"
                                  className="w-full md:w-auto"
                                >
                                  Lihat Detail
                                </Button>
                                {canDownloadCertificate && (
                                  <Button
                                    onClick={async () => {
                                      try {
                                        // If event has legacy sertifikat_kegiatan file, open it directly
                                        if (event.sertifikat_kegiatan && !event.certificate_template_id) {
                                          window.open(event.sertifikat_kegiatan, '_blank');
                                          return;
                                        }
                                        
                                        // Use certificate generation endpoint (works with template or default template)
                                        const token = localStorage.getItem('accessToken');
                                        const API_BASE_URL = process.env.NEXT_PUBLIC_API_KEY;
                                        
                                        // If attendance_id is not available, we need to fetch it first
                                        let finalAttendanceId = attendanceId;
                                        if (!finalAttendanceId) {
                                          // Try to get attendance_id from event detail
                                          try {
                                            const eventDetailResponse = await fetch(`${API_BASE_URL}/events/${event.slug}`, {
                                              headers: {
                                                'Authorization': `Bearer ${token}`
                                              }
                                            });
                                            if (eventDetailResponse.ok) {
                                              const eventDetail = await eventDetailResponse.json();
                                              // Try to get attendance_id from user's events
                                              const userEventsResponse = await fetch(`${API_BASE_URL}/user/events/history`, {
                                                headers: {
                                                  'Authorization': `Bearer ${token}`
                                                }
                                              });
                                              if (userEventsResponse.ok) {
                                                const userEvents = await userEventsResponse.json();
                                                const currentEvent = userEvents.data?.find((e: any) => e.id === event.id);
                                                if (currentEvent?.attendance_id) {
                                                  finalAttendanceId = currentEvent.attendance_id;
                                                }
                                              }
                                            }
                                          } catch (err) {
                                            console.error('Error fetching attendance_id:', err);
                                          }
                                        }
                                        
                                        if (!finalAttendanceId) {
                                          alert('Tidak dapat menemukan data kehadiran. Silakan coba lagi.');
                                          return;
                                        }
                                        
                                        const downloadUrl = `${API_BASE_URL}/certificate/download/${finalAttendanceId}`;
                                        
                                        // Add authorization header via fetch
                                        const response = await fetch(downloadUrl, {
                                          headers: {
                                            'Authorization': `Bearer ${token}`
                                          }
                                        });
                                        
                                        if (response.ok) {
                                          // Check if response is actually a PDF or JSON error
                                          const contentType = response.headers.get('content-type');
                                          if (contentType && contentType.includes('application/json')) {
                                            // It's a JSON error response, not a PDF
                                            const errorData = await response.json();
                                            alert(errorData.message || 'Gagal mengunduh sertifikat. Silakan coba lagi.');
                                            return;
                                          }
                                          
                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.setAttribute('download', `sertifikat-${event.judul_kegiatan.replace(/\s+/g, '-')}.pdf`);
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                          window.URL.revokeObjectURL(url);
                                        } else {
                                          // Handle error response
                                          let errorMessage = 'Gagal mengunduh sertifikat. Silakan coba lagi.';
                                          try {
                                            const errorData = await response.json();
                                            errorMessage = errorData.message || errorData.error || errorMessage;
                                          } catch (e) {
                                            // If response is not JSON, use status text
                                            errorMessage = response.status === 404 
                                              ? 'Template sertifikat tidak ditemukan. Silakan hubungi administrator untuk membuat template default.'
                                              : `Error ${response.status}: ${response.statusText}`;
                                          }
                                          alert(errorMessage);
                                        }
                                      } catch (error) {
                                        console.error('Error downloading certificate:', error);
                                        alert('Gagal mengunduh sertifikat. Silakan coba lagi.');
                                      }
                                    }}
                                    className="w-full md:w-auto bg-primary hover:bg-slate-700"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Sertifikat
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'certificates' && (
                <Card className="border-0 shadow-medium">
                  <CardContent className="py-12 text-center">
                    <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-semibold text-gray-600 mb-2">
                      Belum Ada Sertifikat
                    </p>
                    <p className="text-sm text-gray-500">
                      Sertifikat akan muncul setelah Anda menyelesaikan event
                    </p>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Pembayaran</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchPayments()}
                      disabled={paymentsLoading}
                    >
                      {paymentsLoading ? 'Memuat...' : 'Refresh'}
                    </Button>
                  </div>
                  {paymentsLoading ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat pembayaran...</p>
                      </CardContent>
                    </Card>
                  ) : !Array.isArray(pendingPayments) || pendingPayments.length === 0 ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold text-gray-600 mb-2">
                          Tidak Ada Pembayaran
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                          Belum ada pembayaran untuk kegiatan berbayar.
                        </p>
                        <Button onClick={() => router.push('/events')}>
                          Cari Event
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    (Array.isArray(pendingPayments) ? pendingPayments : []).map((payment) => {
                      const isPaid = payment.status === 'paid';
                      const isExpired = payment.status === 'expired' || payment.status === 'failed';
                      const isPending = payment.status === 'pending';
                      const expiresAt = payment.expiresAt ? new Date(payment.expiresAt) : null;
                      const isExpiringSoon = expiresAt && expiresAt > new Date() && expiresAt.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours
                      
                      return (
                        <Card key={payment.paymentId} className={`border-0 shadow-medium hover:shadow-large transition-shadow ${
                          isPaid ? 'border-emerald-200 bg-emerald-50/50' :
                          isExpired ? 'border-red-200 bg-red-50/50' : 
                          isExpiringSoon ? 'border-amber-200 bg-amber-50/50' : ''
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                      {payment.event?.judul_kegiatan || 'Event Tidak Ditemukan'}
                                    </h3>
                                    {payment.event?.kategori && (
                                      <Badge className={`${EventService.getCategoryColor(payment.event.kategori.nama_kategori)} border`}>
                                        {payment.event.kategori.nama_kategori}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge className={`${
                                      isPaid
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : isExpired 
                                        ? 'bg-red-100 text-red-700 border-red-200' 
                                        : isPending
                                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {isPaid ? 'Sudah Dibayar' : isExpired ? 'Kedaluwarsa' : isPending ? 'Menunggu Pembayaran' : payment.status}
                                    </Badge>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-primary">
                                        {PaymentService.formatAmount(payment.amount)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {payment.event && (
                                  <div className="space-y-2 mt-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Calendar className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                      <span className="font-medium text-gray-700">
                                        {EventService.formatEventDate(payment.event.waktu_mulai)}
                                        {EventService.isSameDay(payment.event.waktu_mulai, payment.event.waktu_berakhir) && (
                                          <span className="ml-2 text-gray-500">
                                            • {EventService.formatEventTime(payment.event.waktu_mulai)} WIB
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <MapPin className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                      <span className="font-medium text-gray-700">
                                        {payment.event.lokasi_kegiatan}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {isPaid && payment.paidAt && (
                                  <div className="flex items-center text-sm text-emerald-600 mt-2">
                                    <CheckCircle2 className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="font-medium">
                                      Dibayar pada {new Date(payment.paidAt).toLocaleString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })} WIB
                                    </span>
                                  </div>
                                )}
                                {expiresAt && isPending && (
                                  <div className={`flex items-center text-sm mt-2 ${
                                    isExpiringSoon ? 'text-amber-600' : 'text-gray-600'
                                  }`}>
                                    <Clock className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="font-medium">
                                      {isExpired ? 'Kedaluwarsa pada ' : 'Batas waktu: '}
                                      {expiresAt.toLocaleString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })} WIB
                                    </span>
                                  </div>
                                )}
                                {isExpired && (
                                  <div className="flex items-center text-sm text-red-600 mt-2">
                                    <AlertCircle className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="font-medium">
                                      Pembayaran telah kedaluwarsa. Silakan daftar ulang untuk event ini.
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 md:justify-center">
                                {payment.event && (
                                  <Button
                                    onClick={() => router.push(`/events/${payment.event.slug}`)}
                                    variant="outline"
                                    className="w-full md:w-auto"
                                  >
                                    Lihat Detail Event
                                  </Button>
                                )}
                                {isPending && (
                                  <Button
                                    onClick={() => router.push(`/payment?payment_id=${payment.paymentId}${payment.event ? `&event_id=${payment.event.id}` : ''}`)}
                                    className="w-full md:w-auto bg-primary hover:bg-slate-700"
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Lanjutkan Pembayaran
                                  </Button>
                                )}
                                {isPaid && (
                                  <Button
                                    onClick={() => router.push(`/payment/success?payment_id=${payment.paymentId}`)}
                                    variant="outline"
                                    className="w-full md:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Lihat Detail Pembayaran
                                  </Button>
                                )}
                                {payment.invoiceUrl && (
                                  <Button
                                    onClick={() => window.open(payment.invoiceUrl!, '_blank')}
                                    variant="outline"
                                    className="w-full md:w-auto"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Buka Invoice
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-0 shadow-medium">
                <CardHeader>
                  <CardTitle className="text-lg">Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => router.push('/events')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Cari Event
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Beranda
                  </Button>
                  <Separator />
                  <Button
                    onClick={async () => {
                      const result = await logout();
                      if (result.success) {
                        router.push('/');
                      }
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    variant="outline"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </Button>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card className="border-0 shadow-medium">
                <CardHeader>
                  <CardTitle className="text-lg">Keamanan Akun</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Email Terverifikasi</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Ubah Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

