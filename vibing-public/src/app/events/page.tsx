'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { EventCard } from '@/components/EventCard';
import { Home, Search, BadgePercent, Contact } from 'lucide-react';
import { EventCardList } from '@/components/EventCardList';
import { SearchFilters } from '@/components/SearchFilters';
import { Footer } from '@/components/Footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, List, LayoutGrid } from 'lucide-react';
import { useEvents, useEventRegistration, useEventCheckIn } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Filters, EventCategory } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { LoadingOverlay } from '@/components/LoadingOverlay';

type ViewMode = 'grid' | 'list';

export default function EventPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    dateRange: 'all'
  });
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [checkInToken, setCheckInToken] = useState('');

  const { events, loading, error, refetch } = useEvents({ 
    limit: 20, 
    search: searchQuery || undefined,
    category: filters.category !== 'all' ? filters.category : undefined,
    time_range: filters.dateRange !== 'all' ? filters.dateRange : undefined
  });

  const { registerEvent, isRegistering } = useEventRegistration();
  const { checkInEvent, isCheckingIn } = useEventCheckIn();
  const { toast } = useToast();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    refetch({ 
      search: query || undefined, 
      category: filters.category !== 'all' ? filters.category : undefined,
      time_range: filters.dateRange !== 'all' ? filters.dateRange : undefined
    });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    refetch({ 
      search: searchQuery || undefined, 
      category: newFilters.category !== 'all' ? newFilters.category : undefined,
      time_range: newFilters.dateRange !== 'all' ? newFilters.dateRange : undefined
    });
  };

  const handleClearFilters = () => {
    const clearedFilters = { category: 'all', dateRange: 'all' };
    setFilters(clearedFilters);
    refetch({ 
      search: searchQuery || undefined, 
      category: undefined,
      time_range: undefined
    });
  };

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
        // Use eventId for payment
        const paymentParam = `event_id=${eventId}`;
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

  // Sort events by nearest time but push events that ended >3 days ago to the bottom
  const sortedEvents = useMemo(() => {
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    return [...events].sort((a, b) => {
      const endA = new Date(a.waktu_berakhir).getTime();
      const endB = new Date(b.waktu_berakhir).getTime();
      const isVeryPastA = now - endA > THREE_DAYS_MS;
      const isVeryPastB = now - endB > THREE_DAYS_MS;

      // If one is very past and the other is not, put the very-past one after
      if (isVeryPastA !== isVeryPastB) return isVeryPastA ? 1 : -1;

      // Otherwise fall back to sorting by start time (nearest first)
      const dateA = new Date(a.waktu_mulai).getTime();
      const dateB = new Date(b.waktu_mulai).getTime();
      return dateA - dateB;
    });
  }, [events]);

  // Extract unique categories from events
  const availableCategories: EventCategory[] = events
    .map(event => event.kategori)
    .filter((kategori, index, self) => 
      kategori && self.findIndex(k => k?.slug === kategori.slug) === index
    ) as EventCategory[];

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

  return (
    <div className="min-h-screen bg-background dark:bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Header headerItems={headerItems} />
      
      {/* Hero Section */}
      <div className="relative z-10 pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-primary bg-clip-text text-transparent">
              Temukan Event Terbaik
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Jelajahi berbagai event menarik dan daftarkan diri Anda untuk pengalaman yang tak terlupakan
            </p>
          </div>

          <div className="mb-8 animate-in fade-in-0 slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            availableCategories={availableCategories}
          />
          </div>
        </div>
        </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-6 relative z-10 max-w-7xl">
        <div className="mb-5 animate-in fade-in-0 slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-2xl md:text-3xl text-white mb-1">
              {loading ? 'Memuat...' : `${events.length} Event Ditemukan`}
            </h2>
              <p className="text-sm text-gray-400">
                {loading ? 'Mohon tunggu...' : 'Event terpilih untuk Anda'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 hidden md:block">
                Diurutkan berdasarkan waktu terdekat
              </div>
              <div className="flex items-center gap-1 bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-lg p-1 border border-gray-700/50 shadow-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 px-3 transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-primary via-slate-500 to-primary shadow-lg shadow-primary/40 text-white scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 px-3 transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-primary via-slate-500 to-primary shadow-lg shadow-primary/40 text-white scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Separator className="mt-4 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>

        {/* Event List/Grid */}
        <div className={`mb-10 ${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'space-y-4'
        }`}>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`bg-gray-900 rounded-lg border border-gray-800 animate-pulse ${
                viewMode === 'grid' ? 'p-6' : 'p-4'
              }`}>
                {viewMode === 'grid' ? (
                  <>
                    <div className="w-full h-48 bg-gray-800 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-800 rounded mb-2"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-800 rounded"></div>
                      <div className="h-3 bg-gray-800 rounded"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-80 h-48 bg-gray-800 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-800 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : error ? (
            <div className={`text-center py-12 ${
              viewMode === 'grid' ? 'col-span-full' : ''
            }`}>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-semibold text-red-400">Gagal memuat event</p>
              <p className="text-sm text-gray-400 mt-2">{error}</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className={`text-center py-12 ${
              viewMode === 'grid' ? 'col-span-full' : ''
            }`}>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <p className="text-lg font-semibold text-gray-300">Tidak ada event ditemukan</p>
              <p className="text-sm text-gray-400 mt-2">Coba ubah kata kunci pencarian</p>
            </div>
          ) : (
            sortedEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                {viewMode === 'grid' ? (
                <EventCard
                  event={event}
                  onViewDetails={handleViewEvent}
                  onRegister={handleRegisterEvent}
                    onCheckIn={handleCheckInClick}
                  isLoggedIn={isLoggedIn}
                  fromPage="event"
                />
              ) : (
                <EventCardList
                  event={event}
                  onViewDetails={handleViewEvent}
                  onRegister={handleRegisterEvent}
                    onCheckIn={handleCheckInClick}
                  isLoggedIn={isLoggedIn}
                  fromPage="event"
                />
                )}
              </div>
            ))
          )}
        </div>
      </div>

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
                variant="success"
                className="flex-1"
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
