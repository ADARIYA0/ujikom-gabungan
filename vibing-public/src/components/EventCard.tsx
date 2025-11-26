'use client';

import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter } from './ui/card';
import { Event } from '@/types';
import { EventService } from '@/services/eventService';

interface EventCardProps {
  event: Event;
  onViewDetails: (eventSlug: string) => void;
  onRegister: (eventId: number) => void;
  onCheckIn?: (eventId: number) => void;
  isLoggedIn: boolean;
  fromPage?: 'home' | 'event';
}

export function EventCard({ event, onViewDetails, onRegister, onCheckIn, isLoggedIn, fromPage = 'home' }: EventCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/events/${event.slug}?from=${fromPage}`);
  };

  const isEventFull = EventService.isEventFull(event);
  const isEventPassed = EventService.isEventPassed(event);
  const isEventStarted = EventService.isEventStarted(event);
  const isRegistered = event.is_registered || false;
  const attendanceStatus = event.attendance_status;
  const categoryName = event.kategori?.nama_kategori || 'Umum';
  const isPaidEvent = event.harga && (typeof event.harga === 'number' ? event.harga > 0 : parseFloat(String(event.harga)) > 0);

  return (
    <Card className={`group transition-all duration-300 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border shadow-medium flex flex-col h-full relative ${
      isEventPassed 
        ? 'border-gray-700 opacity-75 cursor-not-allowed' 
        : 'border-gray-700/50 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/60 hover:shadow-primary/30'
    }`}>
      {/* Glow effect on hover */}
      {!isEventPassed && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-slate-500/0 to-primary/0 group-hover:from-primary/10 group-hover:via-slate-500/15 group-hover:to-primary/10 rounded-lg transition-all duration-300 pointer-events-none"></div>
      )}
      {/* Animated border glow */}
      {!isEventPassed && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-slate-500 to-primary rounded-lg opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 -z-10"></div>
      )}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 group-hover:from-black/40 transition-all duration-300"></div>
        <Image
          src={EventService.getImageUrl(event.flyer_kegiatan || event.gambar_kegiatan)}
          alt={event.judul_kegiatan}
          width={400}
          height={192}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        <div className="absolute top-4 left-4 z-20">
          <Badge className={`${EventService.getCategoryColor(categoryName)} border font-semibold text-xs backdrop-blur-md shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-300`}>
            {categoryName}
          </Badge>
        </div>
        {isEventPassed && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-gray-600 text-white border-gray-600 text-xs font-semibold">Event Tertutup</Badge>
          </div>
        )}
        {!isEventPassed && isEventFull && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-red-500 text-white border-red-500 text-xs font-semibold">Penuh</Badge>
          </div>
        )}
        {isEventPassed && (
          <div className="absolute inset-0 bg-black/40 z-0"></div>
        )}
        <div className={`absolute inset-0 transition-colors duration-300 ${isEventPassed ? 'bg-black/0' : 'bg-black/0 group-hover:bg-black/5'}`}></div>
      </div>
      
      <CardContent className="p-6 flex-1 flex flex-col">
        <h3 className="font-bold mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-slate-400 group-hover:to-primary transition-all duration-300 text-white leading-tight text-lg">
          {event.judul_kegiatan}
        </h3>
        <p className="text-gray-400 mb-5 line-clamp-2 leading-relaxed group-hover:text-gray-300 transition-colors">
          {event.deskripsi_kegiatan}
        </p>
        
        <div className="space-y-3 mb-5">
          <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mr-2">
              <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            </div>
            <span className="text-gray-300 font-medium">{EventService.formatEventDate(event.waktu_mulai)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            <div className="p-1.5 rounded-lg bg-slate-500/10 group-hover:bg-slate-500/20 transition-colors mr-2">
              <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            </div>
            <span className="text-gray-300 font-medium">{EventService.formatEventTime(event.waktu_mulai)} WIB</span>
          </div>
          <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors mr-2">
              <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            </div>
            <span className="text-gray-300 line-clamp-1 font-medium">{event.lokasi_kegiatan}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors mr-2">
              <Users className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
            </div>
            <span className="text-gray-300 font-medium">{event.attendee_count} / {event.kapasitas_peserta} peserta</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 mt-auto">
          <span className={`font-bold text-lg bg-gradient-to-r from-primary via-slate-400 to-primary bg-clip-text text-transparent ${isEventPassed ? 'opacity-50' : ''}`}>
            {EventService.formatPrice(event.harga)}
          </span>
          {isEventPassed ? (
            <div className="text-xs text-gray-300 bg-gradient-to-r from-gray-800 to-gray-700 px-3 py-1.5 rounded-full font-medium border border-gray-600">
              Event Selesai
            </div>
          ) : (
            <div className="text-xs text-slate-200 bg-gradient-to-r from-slate-900/50 to-slate-800/50 px-3 py-1.5 rounded-full font-medium border border-slate-700/50 backdrop-blur-sm">
              {event.kapasitas_peserta - event.attendee_count} slot tersisa
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60">
        <div className="w-full grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleViewDetails}
            className="h-11 border-gray-600/50 text-gray-300 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-700 hover:text-white hover:border-primary/50 transition-all duration-300 font-semibold bg-gray-900/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10"
          >
            Detail
          </Button>
          {isLoggedIn ? (
            isRegistered ? (
              <Button
                onClick={() => onCheckIn ? onCheckIn(event.id) : onViewDetails(event.slug)}
                disabled={attendanceStatus === 'hadir' || isEventPassed || !isEventStarted}
                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
                title={!isEventStarted ? `Check-in dapat dilakukan mulai ${EventService.formatEventStartTime(event)} WIB` : undefined}
              >
                {attendanceStatus === 'hadir' ? 'Sudah Hadir' : isEventPassed ? 'Sudah Lewat' : !isEventStarted ? 'Belum Waktunya' : 'Isi Data Kehadiran'}
              </Button>
            ) : (
              <Button
                onClick={() => onRegister(event.id)}
                disabled={isEventFull || isEventPassed || isEventStarted}
                className="h-11 bg-primary hover:bg-slate-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
              >
                {isEventPassed ? 'Event Sudah Berlalu' : isEventStarted ? 'Pendaftaran Ditutup' : isEventFull ? 'Penuh' : isPaidEvent ? 'Bayar' : 'Daftar'}
              </Button>
            )
          ) : (
            <Button
              onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(`/events/${event.slug}`)}`)}
              disabled={isEventStarted || isEventPassed}
              className="h-11 bg-primary hover:bg-slate-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
            >
              {isEventPassed ? 'Event Sudah Berlalu' : isEventStarted ? 'Pendaftaran Ditutup' : 'Login Dulu'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
