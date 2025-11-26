'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Hero45 } from '@/components/blocks/shadcnblocks-com-hero45';
import { About3 } from '@/components/ui/about-3';
import { FeaturesSectionWithHoverEffects } from '@/components/blocks/feature-section-with-hover-effects';
import { PricingSection, type PricingTier } from '@/components/blocks/pricing-section';
import { Feature197, type FeatureItem as FaqFeatureItem } from '@/components/ui/accordion-feature-section';
import { 
  Home as HomeIcon, 
  Search, 
  BadgePercent, 
  Contact, 
  HandHelping, 
  Users, 
  Zap,
  Calendar, 
  ChevronRight, 
  AlertCircle,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/EventCard';
import { Footer } from '@/components/Footer';
import { useEvents, useEventRegistration, useEventCheckIn } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function Home() {
  const { user, isLoggedIn } = useAuth();
  const { events, loading, error, refetch } = useEvents({ limit: 6, upcoming: true });
  const router = useRouter();
  const { registerEvent, isRegistering } = useEventRegistration();
  const { checkInEvent, isCheckingIn } = useEventCheckIn();
  const { toast } = useToast();
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [checkInToken, setCheckInToken] = useState('');

  const handleViewEvent = (eventSlug: string) => {
    router.push(`/events/${eventSlug}`);
  };

  const handleRegisterEvent = async (eventId: number) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const result = await registerEvent(eventId);

    if (result.success) {
      // If payment is required, redirect to payment page immediately
      if (result.data?.requiresPayment) {
        // Don't show toast, redirect immediately
        // Use attendanceId for payment flow
        const paymentParam = result.data.attendanceId 
          ? `attendance_id=${result.data.attendanceId}` 
          : '';
        router.push(`/payment?${paymentParam}`);
        return;
      }

      // For free events, show success toast
      toast({
        variant: 'success',
        title: 'Pendaftaran Berhasil!',
        description: result.message || 'Kode token dikirim ke email Anda.',
      });
      // Refresh events to update attendee counts and registration status
      await refetch();
    } else {
      toast({
        variant: 'error',
        title: 'Pendaftaran Gagal',
        description: result.message || 'Gagal mendaftar event. Silakan coba lagi.',
      });
    }
  };

  const handleCheckInClick = (eventId: number) => {
    setSelectedEventId(eventId);
    setCheckInToken('');
    setCheckInDialogOpen(true);
  };

  const handleCheckInSubmit = async () => {
    if (!selectedEventId || !checkInToken.trim()) {
      toast({
        variant: 'warning',
        title: 'Token Diperlukan',
        description: 'Masukkan token kehadiran untuk melanjutkan.',
      });
      return;
    }

    const result = await checkInEvent(selectedEventId, checkInToken.trim().toUpperCase());

    if (result.success) {
      toast({
        variant: 'success',
        title: 'Absensi Berhasil!',
        description: result.message || 'Terima kasih telah mengisi kehadiran.',
      });
      setCheckInDialogOpen(false);
      setCheckInToken('');
      setSelectedEventId(null);
      // Refresh events to update attendance status
      await refetch();
    } else {
      toast({
        variant: 'error',
        title: 'Absensi Gagal',
        description: result.message || 'Gagal melakukan absensi. Silakan coba lagi.',
      });
    }
  };

  const handleViewChange = (view: string) => {
    if (view === 'search') {
      router.push('/events');
    } else if (view === 'login') {
      router.push('/login');
    } else if (view === 'register') {
      router.push('/login'); // For now, redirect register to login
    }
  };

  const headerItems = [
    {
      name: "Beranda",
      link: "/",
      icon: <HomeIcon className="h-4 w-4 text-neutral-500 dark:text-white" />,
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

const pricingTiers: PricingTier[] = [
  {
    name: "Peserta",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Akses gratis untuk anggota komunitas yang sudah membuat akun dan login.",
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      {
        name: "Registrasi Kegiatan",
        description: "Hanya bisa mendaftarkan diri ke Kegiatan yang gratis maupun berbayar.",
        included: true,
      },
      {
        name: "Absensi Digital",
        description: "Absensi berbasis digital dengan token via email.",
        included: true,
      },
      {
        name: "Sertifikat Digital",
        description: "Mendapatkan sertifikat digital dari kegiatan yang telah diikuti dan telah berakhir.",
        included: true,
      },
    ],
  },
  {
    name: "Organizer",
    price: {
      monthly: 99000,
      yearly: 1089000,
    },
    description: "Seluruh alat yang dibutuhkan untuk mengelola dan memonetisasi event profesional.",
    icon: <Briefcase className="h-6 w-6" />,
    highlight: true,
    badge: "Paling Populer",
    features: [
      {
        name: "Buat Kegiatan Baru",
        description: "Bisa membuat Kegiatan baru dengan fitur lengkap untuk manajemen event.",
        included: true,
      },
      {
        name: "Buat Kategori Kegiatan",
        description: "Bisa membuat Kategori Kegiatan baru untuk mengorganisir berbagai jenis event.",
        included: true,
      },
    ],
  },
];

const faqFeatures: FaqFeatureItem[] = [
  {
    id: 1,
    title: "Bagaimana memastikan peserta menerima tiket digitalnya?",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=600&auto=format&fit=crop",
    description:
      "Setiap registrasi langsung mendapatkan email berisi tiket dan token check-in. Anda dapat menjadwalkan pengiriman ulang otomatis dan memonitor tiket yang belum dibuka pada dashboard analytics.",
  },
  {
    id: 2,
    title: "Apa saja kanal pembayaran yang didukung?",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=900&h=600&auto=format&fit=crop",
    description:
      "Platform ini terintegrasi dengan transfer bank, kartu kredit, dan e-wallet populer di Indonesia. Organizer bisa mengatur biaya admin, kode promo, hingga otomatisasi invoice untuk partner korporat.",
  },
  {
    id: 3,
    title: "Bagaimana cara mengatur absensi on-site dan online sekaligus?",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=600&auto=format&fit=crop",
    description:
      "Gunakan mode hybrid: peserta online cukup memasukkan token via dashboard, sementara peserta on-site melakukan scan QR. Hasil absensi tersinkron secara real-time sehingga laporan hadir tersedia seketika.",
  },
  {
    id: 4,
    title: "Bisakah sponsor melihat performa kampanye mereka?",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=600&auto=format&fit=crop",
    description:
      "Ya, setiap sponsor memperoleh akses ke insight yang menampilkan impresi logo, klik CTA, hingga jumlah peserta yang menebus voucher. Anda bebas mengatur level akses untuk tiap sponsor.",
  },
  {
    id: 5,
    title: "Seberapa aman data peserta yang terkumpul?",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=600&auto=format&fit=crop",
    description:
      "Seluruh data terenkripsi, backup otomatis harian, dan dapat diekspor dengan audit log. Anda dapat menetapkan role panitia agar hanya tim tertentu yang dapat mengunduh data sensitif.",
  },
];

  return (
    <div>
      <Header headerItems={headerItems} />

      {/* Hero Section - Using Hero45 Component */}
      <Hero45
        badge="vibing.my.id"
        heading="Platform Event Terpercaya untuk Pengalaman Tak Terlupakan"
        imageSrc="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop"
        imageAlt="Event Platform"
        features={[
          {
            icon: <HandHelping className="h-auto w-5" />,
            title: "Dukungan Fleksibel",
            description:
              "Nikmati bantuan 24/7 untuk menjaga bisnis Anda berjalan lancar.",
          },
          {
            icon: <Users className="h-auto w-5" />,
            title: "Alat Kolaboratif",
            description:
              "Tingkatkan kerja tim dengan alat yang dirancang untuk menyederhanakan manajemen proyek dan komunikasi.",
          },
          {
            icon: <Zap className="h-auto w-5" />,
            title: "Kecepatan Super",
            description:
              "Rasakan waktu muat tercepat dengan server berkinerja tinggi kami.",
          },
        ]}
      />

      {/* About Section */}
      <About3
        title="VIBING adalah platform untuk mengelola event secara menyeluruh"
        description="Dari perencanaan hingga absensi, VIBING menyatukan kanal komunikasi, registrasi, dan pembayaran dalam satu dashboard yang dapat diakses oleh tim mana pun."
        mainImage={{
          src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
          alt: "Tim sedang merencanakan event",
        }}
        secondaryImage={{
          src: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1000&q=80",
          alt: "Koordinasi tim online",
        }}
        breakout={{
          src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
          alt: "Live monitoring",
          title: "Semua metrik dalam satu jendela",
          description:
            "Pantau registrasi, sponsor, kontrol akses, dan laporan keuangan tanpa beralih antar aplikasi.",
          buttonText: "Jelajahi VIBING",
          buttonUrl: "https://vibing.my.id",
        }}
        companiesTitle="Dipercaya oleh komunitas penyelenggara",
        achievementsTitle="Angka dari setiap event yang kami bantu",
        achievementsDescription="VIBING menjaga setiap detail tetap terlihat, mulai dari pengelolaan kategori hingga KPI pasca-event."
        achievements={[
          { label: "Event otomatis", value: "1.200+" },
          { label: "Check-in terkirim", value: "250.000+" },
          { label: "Kepuasan peserta", value: "98%" },
          { label: "Rilis update", value: "35+" },
        ]}
      />

      {/* Features Section with Hover Effects */}
      <section className="py-16 bg-background dark:bg-black transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Fitur Unggulan Platform</h2>
            <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto text-lg">
              Solusi lengkap untuk semua kebutuhan manajemen event Anda
            </p>
          </div>
          <FeaturesSectionWithHoverEffects />
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-background dark:bg-[#050505] transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 mb-4 font-semibold">
              UPCOMING EVENT
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Event Terbaik Bulan Ini</h2>
            <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto text-lg">
              Jangan lewatkan event populer yang paling diminati peserta kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 animate-pulse"
                >
                  <div className="w-full h-48 bg-gray-200 dark:bg-slate-800 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <div className="text-red-500 mb-4">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">Gagal memuat event</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{error}</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-slate-700" />
                <p className="text-lg font-semibold text-gray-600 dark:text-slate-200">Belum ada event tersedia</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  Event akan segera hadir, pantau terus ya!
                </p>
              </div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={handleViewEvent}
                  onRegister={handleRegisterEvent}
                  onCheckIn={handleCheckInClick}
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

      {/* Pricing Section */}
      <PricingSection tiers={pricingTiers} className="bg-background dark:bg-black transition-colors" />

      {/* FAQ Section */}
      <section className="bg-background dark:bg-black py-16 transition-colors">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-semibold">
            FREQUENTLY ASKED QUESTIONS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pertanyaan yang Paling Sering Kami Terima
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            Temukan jawaban seputar tiket, pembayaran, sponsor, hingga keamanan data dalam penyelenggaraan
            event digital berskala besar.
          </p>
        </div>
      </section>
      <Feature197 features={faqFeatures} className="bg-background dark:bg-black pt-0 pb-12 transition-colors" />

      {/* Check-In Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Isi Data Kehadiran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-800">
                Masukkan kode token 10 digit yang telah dikirim ke email Anda untuk melakukan absensi.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="checkInToken">Token Kehadiran (10 digit)</Label>
              <Input
                id="checkInToken"
                placeholder="Masukkan token (contoh: ABC123XYZ9)"
                value={checkInToken}
                onChange={(e) => setCheckInToken(e.target.value.toUpperCase())}
                maxLength={10}
                className="text-center text-lg font-mono tracking-widest"
                disabled={isCheckingIn}
              />
              <p className="text-xs text-gray-500">
                Token dikirim ke email Anda saat pendaftaran
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Perhatian:</p>
                <p>Pastikan token yang Anda masukkan benar. Token hanya dapat digunakan sekali.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCheckInDialogOpen(false);
                  setCheckInToken('');
                  setSelectedEventId(null);
                }}
                className="flex-1"
                disabled={isCheckingIn}
              >
                Batal
              </Button>
              <Button
                onClick={handleCheckInSubmit}
                disabled={isCheckingIn || !checkInToken.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isCheckingIn ? 'Memproses...' : 'Konfirmasi Absensi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoadingOverlay 
        isLoading={isRegistering} 
        message="Mendaftarkan event..."
      />

      <Footer />
    </div>
  );
}