'use client';

import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Event } from '@/types';
import { EventService } from '@/services/eventService';

interface EventCardListProps {
    event: Event;
    onViewDetails: (eventSlug: string) => void;
    onRegister: (eventId: number) => void;
    onCheckIn?: (eventId: number) => void;
    isLoggedIn: boolean;
    fromPage?: 'home' | 'event';
}

export function EventCardList({ event, onViewDetails, onRegister, onCheckIn, isLoggedIn, fromPage = 'home' }: EventCardListProps) {
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
        <Card className={`group transition-all duration-300 overflow-hidden bg-gray-900 border shadow-sm flex flex-col ${
            isEventPassed 
                ? 'border-gray-700 opacity-75 cursor-not-allowed' 
                : 'border-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-700'
        }`}>
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="relative md:w-80 md:flex-shrink-0">
                        <Image
                            src={EventService.getImageUrl(event.flyer_kegiatan || event.gambar_kegiatan)}
                            alt={event.judul_kegiatan}
                            width={320}
                            height={200}
                            className="w-full h-48 md:h-full md:min-h-[200px] object-cover group-hover:scale-105 transition-transform duration-300"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                        <div className="absolute top-4 left-4">
                            <Badge className={`${EventService.getCategoryColor(categoryName)} border font-semibold text-xs backdrop-blur-sm`}>
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

                    {/* Content Section */}
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="flex-1">
                            <h3 className="font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors text-white leading-tight text-xl">
                                {event.judul_kegiatan}
                            </h3>
                            <p className="text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                                {event.deskripsi_kegiatan}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center text-sm text-gray-400">
                                    <Calendar className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-300 font-medium">{EventService.formatEventDate(event.waktu_mulai)}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <Clock className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-300 font-medium">{EventService.formatEventTime(event.waktu_mulai)} WIB</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <MapPin className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-300 line-clamp-1 font-medium">{event.lokasi_kegiatan}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <Users className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-300 font-medium">{event.attendee_count} / {event.kapasitas_peserta} peserta</span>
                                </div>
                            </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-gray-700">
                            <div className="flex items-center justify-between md:justify-start md:gap-6">
                                <span className="font-bold text-primary text-xl">
                                    {EventService.formatPrice(event.harga)}
                                </span>
                                <div className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full font-medium border border-gray-700">
                                    {event.kapasitas_peserta - event.attendee_count} slot tersisa
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleViewDetails}
                                    className="h-10 px-6 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-colors font-semibold bg-gray-900"
                                >
                                    Detail
                                </Button>
                                {isLoggedIn ? (
                                    isRegistered ? (
                                        <Button
                                            onClick={() => onCheckIn ? onCheckIn(event.id) : onViewDetails(event.slug)}
                                            disabled={attendanceStatus === 'hadir' || isEventPassed || !isEventStarted}
                                            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
                                            title={!isEventStarted ? `Check-in dapat dilakukan mulai ${EventService.formatEventStartTime(event)} WIB` : undefined}
                                        >
                                            {attendanceStatus === 'hadir' ? 'Sudah Hadir' : isEventPassed ? 'Sudah Lewat' : !isEventStarted ? 'Belum Waktunya' : 'Isi Data Kehadiran'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => onRegister(event.id)}
                                            disabled={isEventFull || isEventPassed || isEventStarted}
                                            className="h-10 px-6 bg-primary hover:bg-slate-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
                                        >
                                            {isEventPassed ? 'Event Sudah Berlalu' : isEventStarted ? 'Pendaftaran Ditutup' : isEventFull ? 'Penuh' : isPaidEvent ? 'Bayar' : 'Daftar'}
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(`/events/${event.slug}`)}`)}
                                        disabled={isEventStarted || isEventPassed}
                                        className="h-10 px-6 bg-primary hover:bg-slate-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
                                    >
                                        {isEventPassed ? 'Event Sudah Berlalu' : isEventStarted ? 'Pendaftaran Ditutup' : 'Login Dulu'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
