'use client';

import { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EventService } from '@/services/eventService';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'certificates'>('profile');

  // Redirect if not logged in
  if (!isLoggedIn) {
    router.push('/login');
    return null;
  }

  // Mock data - replace with actual API calls
  const registeredEvents = [
    {
      id: 1,
      judul_kegiatan: 'Workshop NodeJS',
      slug: 'workshop-nodejs',
      waktu_mulai: '2025-12-01T12:00:00',
      lokasi_kegiatan: 'Aula Lantai 2',
      kategori: { nama_kategori: 'Workshop' },
      status: 'terdaftar'
    }
  ];

  const completedEvents = [];
  const certificates = [];

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="profile" />
      
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
              <div className="bg-gradient-to-r from-primary to-teal-600 p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {user?.name || 'User'}
                    </h1>
                    <p className="text-teal-100 mb-4">{user?.email || ''}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        Member Aktif
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {registeredEvents.length} Event Terdaftar
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
                {registeredEvents.length > 0 && (
                  <Badge className="ml-2 bg-primary text-white text-xs">
                    {registeredEvents.length}
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
                        <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                          <div className="flex items-center gap-3 mb-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-gray-600">Event Terdaftar</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{registeredEvents.length}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Event Selesai</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{completedEvents.length}</p>
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
                  {registeredEvents.length === 0 ? (
                    <Card className="border-0 shadow-medium">
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold text-gray-600 mb-2">
                          Belum Ada Event Terdaftar
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                          Daftarkan diri Anda untuk event yang menarik!
                        </p>
                        <Button onClick={() => router.push('/event')}>
                          Cari Event
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    registeredEvents.map((event) => (
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
                                  Terdaftar
                                </Badge>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                  <span className="font-medium text-gray-700">
                                    {EventService.formatEventDate(event.waktu_mulai)}
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
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 md:justify-center">
                              <Button
                                onClick={() => router.push(`/event/${event.slug}`)}
                                variant="outline"
                                className="w-full md:w-auto"
                              >
                                Lihat Detail
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
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
                    onClick={() => router.push('/event')}
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

