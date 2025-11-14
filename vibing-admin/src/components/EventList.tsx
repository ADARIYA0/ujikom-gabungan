"use client";

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AnimatedDialog, AnimatedDialogContent, AnimatedDialogDescription, AnimatedDialogHeader, AnimatedDialogTitle } from './ui/animated-dialog';
import { Calendar, Clock, MapPin, Users, Eye, Plus, Search, RefreshCw, AlertCircle, Image } from 'lucide-react';
import { Input } from './ui/input';
import { useEvents } from '@/hooks/useEvents';
import { useDebounce } from '@/hooks/useDebounce';
import AnimatedEventForm from './AnimatedEventForm';
import ErrorAlert from './ErrorAlert';

interface EventListProps {
  onViewEvent: (event: Event) => void;
  onCreateEvent: (eventData: any) => void;
}

export default function EventList({ onViewEvent, onCreateEvent }: EventListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isClosingDialog, setIsClosingDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Event['status']>('all');
  
  // Use debounce hook with 400ms delay for better UX
  const debouncedSearch = useDebounce(searchTerm, 400);

  const { events, loading, error, refetch, addEvent } = useEvents({
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter
  });

  const getStatusBadge = (status: Event['status']) => {
    const statusConfig = {
      upcoming: { label: 'Akan Datang', className: 'bg-blue-100 text-blue-800' },
      ongoing: { label: 'Berlangsung', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Selesai', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={`${config.className} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const handleCreateEvent = async (eventData: any) => {
    onCreateEvent(eventData);
    addEvent(eventData);
    handleCloseDialog();
    
    // Refetch data from server to ensure fresh data with proper URLs
    setTimeout(async () => {
      await refetch();
    }, 500); // Small delay to ensure backend processing is complete
  };

  const handleCloseDialog = () => {
    setIsClosingDialog(true);
    setTimeout(() => {
      setShowCreateDialog(false);
      setIsClosingDialog(false);
    }, 150); // Match CSS animation duration (0.15s)
  };

  const filteredEvents = events.filter((event: Event) => {
    if (statusFilter === 'all') return true;
    return event.status === statusFilter;
  });

  const statusCounts = {
    all: events.length,
    upcoming: events.filter((e: Event) => e.status === 'upcoming').length,
    ongoing: events.filter((e: Event) => e.status === 'ongoing').length,
    completed: events.filter((e: Event) => e.status === 'completed').length,
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Daftar Event</h2>
            <p className="text-gray-600">Kelola semua event yang telah dibuat</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white flex-1 sm:flex-none transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-90" />
              Buat Event Baru
            </Button>
          </div>
        </div>

        {error && (
          <ErrorAlert 
            error={error} 
            onRetry={refetch}
          />
        )}


        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari event berdasarkan judul, lokasi, atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-teal-600 hover:bg-teal-700' : 'border-teal-300 text-teal-700 hover:bg-teal-50'}
            >
              Semua ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('upcoming')}
              className={statusFilter === 'upcoming' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}
            >
              Akan Datang ({statusCounts.upcoming})
            </Button>
            <Button
              variant={statusFilter === 'ongoing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ongoing')}
              className={statusFilter === 'ongoing' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
            >
              Berlangsung ({statusCounts.ongoing})
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className={statusFilter === 'completed' ? 'bg-gray-600 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
            >
              Selesai ({statusCounts.completed})
            </Button>
          </div>
        </div>

        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="h-5 bg-gray-200 rounded flex-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded mt-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredEvents.map((event: Event, index: number) => (
            <Card 
              key={event.id} 
              className="hover:shadow-lg transition-all duration-300 ease-out border-l-4 border-l-teal-500 flex flex-col h-full transform hover:scale-[1.02] hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-2 flex-1">
                      {event.title}
                    </CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100 mb-4">
                  {event.imageUrl && event.imageUrl !== '/placeholder-event.jpg' ? (
                    <img
                      src={event.imageUrl}
                      alt={`Gambar ${event.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                      onLoad={(e) => {
                        const placeholder = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'none';
                        }
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs ${event.imageUrl && event.imageUrl !== '/placeholder-event.jpg' ? 'hidden' : 'flex'}`}>
                    <Image className="h-8 w-8 mb-2 text-gray-300" />
                    <span>Gambar Event</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span className="truncate">{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span>{new Intl.DateTimeFormat('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).format(event.startDate)} - {new Intl.DateTimeFormat('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).format(event.endDate)} WIB</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span>{event.participants} / {event.capacity === 0 ? '∞' : event.capacity} peserta</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {event.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewEvent(event)}
                    className="w-full border-teal-300 text-teal-700 hover:bg-teal-50 mt-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
                  >
                    <Eye className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    Lihat Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <Card className="p-8 md:p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4" />
              <h3 className="text-lg mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Tidak Ada Event Ditemukan' : 'Belum Ada Event'}
              </h3>
              <p className="text-sm md:text-base">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Coba ubah kata kunci pencarian atau filter status'
                  : 'Buat event pertama Anda untuk mulai mengelola kegiatan'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Event Pertama
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <AnimatedDialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          } else {
            setShowCreateDialog(true);
          }
        }}
      >
        <AnimatedDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <AnimatedDialogHeader className="flex-shrink-0 relative">
            <button
              onClick={handleCloseDialog}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-200 hover:scale-110 hover:rotate-90"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <AnimatedDialogTitle className="pr-10">Buat Event Baru</AnimatedDialogTitle>
            <AnimatedDialogDescription>
              Lengkapi informasi event yang akan diselenggarakan
            </AnimatedDialogDescription>
          </AnimatedDialogHeader>
          <div className="flex-1 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <AnimatedEventForm 
              onSubmit={handleCreateEvent}
              onCancel={handleCloseDialog}
            />
          </div>
        </AnimatedDialogContent>
      </AnimatedDialog>
    </>
  );
}
