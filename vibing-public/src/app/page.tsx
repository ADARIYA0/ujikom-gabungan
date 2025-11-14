'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/EventCard';
import { Footer } from '@/components/Footer';
import { Calendar, ChevronRight, Star, Shield, Zap } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoggedIn } = useAuth();
  const { events, loading, error } = useEvents({ limit: 6, upcoming: true });
  const router = useRouter();

  const handleViewEvent = (eventSlug: string) => {
    router.push(`/event/${eventSlug}`);
  };

  const handleRegisterEvent = (eventId: number) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    console.log('Register for event:', eventId);
  };

  const handleViewChange = (view: string) => {
    if (view === 'search') {
      router.push('/event');
    } else if (view === 'login') {
      router.push('/login');
    } else if (view === 'register') {
      router.push('/login'); // For now, redirect register to login
    }
  };

  return (
    <div>
      <Header
        currentView="home"
        onViewChange={handleViewChange}
        transparent={true}
      />

      {/* Hero Section - Using New Hero Component */}
      <Hero
        backgroundImage="/hero-background.jpg"
      />

      {/* VIBE Section */}
      <section className="bg-black relative overflow-hidden">
        <div className="w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 w-full h-auto md:h-auto lg:h-[800px]">
            <div className="group relative transition-all duration-500 h-auto min-h-[500px] md:h-[400px] lg:h-[800px] vibe-separator md:vibe-separator-tablet overflow-hidden">
              
              {/* Background dengan animasi hover */}
              <div className="absolute inset-0 bg-black group-hover:bg-teal-600 transition-all duration-500"></div>
              
              {/* Face 2 - Huruf Besar dengan animasi perpindahan */}
              <div className="absolute inset-0 flex flex-col justify-center transition-all duration-500 z-20">
                <div className="relative p-8 md:p-12 text-center md:text-left w-full transform transition-all duration-500 group-hover:-translate-y-32 md:group-hover:-translate-y-40 lg:group-hover:-translate-y-48">
                  {/* Teks Tagline V dengan animasi */}
                  <div className="text-8xl md:text-9xl lg:text-[12rem] font-bold text-white group-hover:text-6xl group-hover:md:text-7xl group-hover:lg:text-8xl group-hover:text-black transition-all duration-500 group-hover:mb-6" style={{ lineHeight: '1' }}>
                    V
                  </div>
                  
                  {/* Konten Detail (muncul saat hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    {/* Judul Vision */}
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-8 transition-colors duration-500 leading-tight">
                      Vision
                    </h3>
                    
                    {/* Deskripsi */}
                    <p className="text-black text-sm md:text-base lg:text-lg leading-relaxed transition-colors duration-500">
                      Kami percaya setiap acara dimulai dari sebuah visi.
                      Kami membangun setiap konsep dengan pandangan jauh ke depan —
                      menciptakan pengalaman yang tak hanya berkesan hari ini, tapi juga meninggalkan jejak untuk masa depan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Overlay untuk efek visual */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            <div className="group relative transition-all duration-500 h-auto min-h-[500px] md:h-[400px] lg:h-[800px] vibe-separator md:vibe-separator-tablet-right overflow-hidden">
              
              {/* Background dengan animasi hover */}
              <div className="absolute inset-0 bg-black group-hover:bg-teal-600 transition-all duration-500"></div>
              
              {/* Face 2 - Huruf Besar dengan animasi perpindahan */}
              <div className="absolute inset-0 flex flex-col justify-center transition-all duration-500 z-20">
                <div className="relative p-8 md:p-12 text-center md:text-left w-full transform transition-all duration-500 group-hover:-translate-y-32 md:group-hover:-translate-y-40 lg:group-hover:-translate-y-48">
                  {/* Teks Tagline I dengan animasi */}
                  <div className="text-8xl md:text-9xl lg:text-[12rem] font-bold text-white group-hover:text-6xl group-hover:md:text-7xl group-hover:lg:text-8xl group-hover:text-black transition-all duration-500 group-hover:mb-6" style={{ lineHeight: '1' }}>
                    I
                  </div>
                  
                  {/* Konten Detail (muncul saat hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    {/* Judul Integrity */}
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-8 transition-colors duration-500 leading-tight">
                      Integrity
                    </h3>
                    
                    {/* Deskripsi */}
                    <p className="text-black text-sm md:text-base lg:text-lg leading-relaxed transition-colors duration-500">
                      Kejujuran dan komitmen adalah dasar setiap interaksi kami.
                      Kami menjunjung tinggi transparansi dan profesionalisme dalam setiap tahap —
                      dari ide hingga pelaksanaan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Overlay untuk efek visual */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            <div className="group relative transition-all duration-500 h-auto min-h-[500px] md:h-[400px] lg:h-[800px] vibe-separator md:vibe-separator-tablet-bottom overflow-hidden">
              
              {/* Background dengan animasi hover */}
              <div className="absolute inset-0 bg-black group-hover:bg-teal-600 transition-all duration-500"></div>
              
              {/* Face 2 - Huruf Besar dengan animasi perpindahan */}
              <div className="absolute inset-0 flex flex-col justify-center transition-all duration-500 z-20">
                <div className="relative p-8 md:p-12 text-center md:text-left w-full transform transition-all duration-500 group-hover:-translate-y-32 md:group-hover:-translate-y-40 lg:group-hover:-translate-y-48">
                  {/* Teks Tagline B dengan animasi */}
                  <div className="text-8xl md:text-9xl lg:text-[12rem] font-bold text-white group-hover:text-6xl group-hover:md:text-7xl group-hover:lg:text-8xl group-hover:text-black transition-all duration-500 group-hover:mb-6" style={{ lineHeight: '1' }}>
                    B
                  </div>
                  
                  {/* Konten Detail (muncul saat hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    {/* Judul Boldness */}
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-8 transition-colors duration-500 leading-tight">
                      Boldness
                    </h3>
                    
                    {/* Deskripsi */}
                    <p className="text-black text-sm md:text-base lg:text-lg leading-relaxed transition-colors duration-500">
                      Kami berani berbeda.
                      Kami menciptakan konsep yang segar, menantang batas,
                      dan meninggalkan kesan mendalam dalam setiap pengalaman yang kami rancang.
                    </p>
                  </div>
                </div>
              </div>

              {/* Overlay untuk efek visual */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            <div className="group relative transition-all duration-500 h-auto min-h-[500px] md:h-[400px] lg:h-[800px] overflow-hidden">
              
              {/* Background dengan animasi hover */}
              <div className="absolute inset-0 bg-black group-hover:bg-teal-600 transition-all duration-500"></div>
              
              {/* Face 2 - Huruf Besar dengan animasi perpindahan */}
              <div className="absolute inset-0 flex flex-col justify-center transition-all duration-500 z-20">
                <div className="relative p-8 md:p-12 text-center md:text-left w-full transform transition-all duration-500 group-hover:-translate-y-32 md:group-hover:-translate-y-40 lg:group-hover:-translate-y-48">
                  {/* Teks Tagline E dengan animasi */}
                  <div className="text-8xl md:text-9xl lg:text-[12rem] font-bold text-white group-hover:text-6xl group-hover:md:text-7xl group-hover:lg:text-8xl group-hover:text-black transition-all duration-500 group-hover:mb-6" style={{ lineHeight: '1' }}>
                    E
                  </div>
                  
                  {/* Konten Detail (muncul saat hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    {/* Judul Experience */}
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-8 transition-colors duration-500 leading-tight">
                      Experience
                    </h3>
                    
                    {/* Deskripsi */}
                    <p className="text-black text-sm md:text-base lg:text-lg leading-relaxed transition-colors duration-500">
                      Setiap event adalah pengalaman.
                      Kami merancang momen yang menggugah emosi, mempertemukan orang, dan
                      menciptakan kenangan yang melekat lama setelah acara berakhir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Overlay untuk efek visual */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-teal-100 text-teal-700 border-teal-200 mb-4 font-semibold">
              Event Populer
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Event Terbaik Bulan Ini</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Jangan lewatkan event populer yang paling diminati peserta kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <div className="text-red-500 mb-4">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Gagal memuat event</p>
                  <p className="text-sm text-gray-500 mt-2">{error}</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-600">Belum ada event tersedia</p>
                <p className="text-sm text-gray-500 mt-2">Event akan segera hadir, pantau terus ya!</p>
              </div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={handleViewEvent}
                  onRegister={handleRegisterEvent}
                  isLoggedIn={isLoggedIn}
                  fromPage="home"
                />
              ))
            )}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={() => handleViewChange('search')}
              className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-8 py-3"
            >
              Lihat Semua Event
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 mb-4 font-semibold">
              Dipercaya Oleh
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Ribuan Peserta Setia</h2>
            <p className="text-gray-600 text-lg">Bergabunglah dengan komunitas yang terus berkembang</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-medium hover:shadow-large transition-all duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Keamanan Terjamin</h4>
              <p className="text-gray-600">Data dan transaksi aman dengan enkripsi tingkat enterprise</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-medium hover:shadow-large transition-all duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Proses Cepat</h4>
              <p className="text-gray-600">Pendaftaran instant dan konfirmasi otomatis dalam hitungan detik</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-medium hover:shadow-large transition-all duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Rating Tinggi</h4>
              <p className="text-gray-600">4.9/5 rating dari ribuan peserta yang puas dengan layanan kami</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}