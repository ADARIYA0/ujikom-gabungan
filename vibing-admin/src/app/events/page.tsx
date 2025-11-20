"use client";

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import EventList from '@/components/EventList';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Image, Award, FileText } from 'lucide-react';

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const handleCreateEvent = (eventData: any) => {
    // Handle event creation
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const formatTimeRange = (startDate: Date, endDate: Date) => {
    const startTime = formatTime(startDate);
    const endTime = formatTime(endDate);
    return `${startTime} - ${endTime}`;
  };

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

  return (
    <ProtectedRoute>
      <AdminLayout>
        <EventList 
          onViewEvent={handleViewEvent}
          onCreateEvent={handleCreateEvent}
        />
        
        {/* <Toaster position="top-right" richColors /> */}

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedEvent && (
            <>
              <DialogHeader className="flex-shrink-0 relative">
                <button
                  onClick={() => setShowEventDialog(false)}
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-200 hover:scale-110 hover:rotate-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-10">
                  <span className="text-lg md:text-xl">{selectedEvent.title}</span>
                  {getStatusBadge(selectedEvent.status)}
                </DialogTitle>
                <DialogDescription>
                  Detail lengkap informasi event
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                <div className="space-y-6 p-1">
                {/* Flyer */}
                {selectedEvent.flyer && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600" />
                      <h4 className="font-medium">Flyer Event</h4>
                    </div>
                    <div className="h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={selectedEvent.flyer}
                        alt={`Flyer ${selectedEvent.title}`}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `
                              <div class="flex items-center justify-center h-full text-gray-400">
                                <div class="text-center">
                                  <FileText class="h-8 w-8 mx-auto mb-2" />
                                  <p class="text-sm">Gagal memuat flyer</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium">Tanggal & Waktu</span>
                      </div>
                      <p className="text-sm font-medium">{formatDate(selectedEvent.startDate)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <p className="text-xs text-gray-600">{formatTimeRange(selectedEvent.startDate, selectedEvent.endDate)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium">Lokasi</span>
                      </div>
                      <p className="text-sm">{selectedEvent.location}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium">Peserta</span>
                      </div>
                      <p className="text-sm font-medium">
                        {selectedEvent.participants} / {selectedEvent.capacity === 0 ? '∞' : selectedEvent.capacity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedEvent.capacity === 0 ? 'Tidak terbatas' : `${selectedEvent.participants} dari ${selectedEvent.capacity} peserta`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium">Sertifikat</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedEvent.certificate ? 'Tersedia' : 'Tidak tersedia'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    <h4 className="font-medium">Deskripsi Event</h4>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedEvent.description}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Certificate Preview */}
                {selectedEvent.certificate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-teal-600" />
                      <h4 className="font-medium">Template Sertifikat</h4>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={selectedEvent.certificate}
                        alt={`Sertifikat ${selectedEvent.title}`}
                        className="w-full h-auto object-contain max-h-96"
                        style={{ aspectRatio: 'auto' }}
                        crossOrigin="anonymous"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          const container = img.parentElement;
                          if (container) {
                            // Auto-adjust container height based on image aspect ratio
                            const aspectRatio = img.naturalHeight / img.naturalWidth;
                            const containerWidth = container.offsetWidth;
                            const calculatedHeight = containerWidth * aspectRatio;
                            container.style.height = `${Math.min(calculatedHeight, 384)}px`; // max 384px (max-h-96)
                          }
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `
                              <div class="flex items-center justify-center h-32 text-gray-400">
                                <div class="text-center">
                                  <Award class="h-8 w-8 mx-auto mb-2" />
                                  <p class="text-sm">Gagal memuat sertifikat</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
