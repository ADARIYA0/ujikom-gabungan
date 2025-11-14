'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { EventCard } from '@/components/EventCard';
import { EventCardList } from '@/components/EventCardList';
import { SearchFilters } from '@/components/SearchFilters';
import { Footer } from '@/components/Footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Filters, EventCategory, Event } from '@/types';

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

  const { events, loading, error, refetch } = useEvents({ 
    limit: 20, 
    search: searchQuery || undefined,
    category: filters.category !== 'all' ? filters.category : undefined,
    time_range: filters.dateRange !== 'all' ? filters.dateRange : undefined
  });

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
    router.push(`/event/${eventSlug}`);
  };

  const handleRegisterEvent = (eventId: number) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    console.log('Register for event:', eventId);
  };

  // Sort events by nearest time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
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

  return (
    <div className="min-h-screen bg-white">
      <Header currentView="search" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Cari Event Favoritmu</h1>
          <p className="text-gray-600 mb-5">
            Temukan event yang sesuai dengan minat dan kebutuhanmu
          </p>
          
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            availableCategories={availableCategories}
          />
        </div>

        <div className="mb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-900">
              {loading ? 'Memuat...' : `${events.length} Event Ditemukan`}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Diurutkan berdasarkan waktu terdekat
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 px-3 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 px-3 transition-all ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Separator className="mt-3 bg-gray-200" />
        </div>

        {/* Event List/Grid */}
        <div className={`mb-10 ${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'space-y-4'
        }`}>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`bg-white rounded-lg border border-gray-200 animate-pulse ${
                viewMode === 'grid' ? 'p-6' : 'p-4'
              }`}>
                {viewMode === 'grid' ? (
                  <>
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-80 h-48 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
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
              <Calendar className="h-16 w-16 mx-auto mb-4 text-red-300" />
              <p className="text-lg font-semibold text-red-600">Gagal memuat event</p>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className={`text-center py-12 ${
              viewMode === 'grid' ? 'col-span-full' : ''
            }`}>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold text-gray-600">Tidak ada event ditemukan</p>
              <p className="text-sm text-gray-500 mt-2">Coba ubah kata kunci pencarian</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              viewMode === 'grid' ? (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={handleViewEvent}
                  onRegister={handleRegisterEvent}
                  isLoggedIn={isLoggedIn}
                  fromPage="event"
                />
              ) : (
                <EventCardList
                  key={event.id}
                  event={event}
                  onViewDetails={handleViewEvent}
                  onRegister={handleRegisterEvent}
                  isLoggedIn={isLoggedIn}
                  fromPage="event"
                />
              )
            ))
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
