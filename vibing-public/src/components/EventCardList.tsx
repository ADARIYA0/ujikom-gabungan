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
        router.push(`/event/${event.slug}?from=${fromPage}`);
    };

    const isEventFull = EventService.isEventFull(event);
    const isEventPassed = EventService.isEventPassed(event);
    const isEventStarted = EventService.isEventStarted(event);
    const isRegistered = event.is_registered || false;
    const attendanceStatus = event.attendance_status;
    const categoryName = event.kategori?.nama_kategori || 'Umum';

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border border-gray-200 shadow-sm hover:-translate-y-0.5">
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
                        {isEventFull && (
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-red-500 text-white border-red-500 text-xs font-semibold">Penuh</Badge>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="flex-1">
                            <h3 className="font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors text-gray-900 leading-tight text-xl">
                                {event.judul_kegiatan}
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                {event.deskripsi_kegiatan}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{EventService.formatEventDate(event.waktu_mulai)}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{EventService.formatEventTime(event.waktu_mulai)} WIB</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-700 line-clamp-1 font-medium">{event.lokasi_kegiatan}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Users className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{event.attendee_count} / {event.kapasitas_peserta} peserta</span>
                                </div>
                            </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between md:justify-start md:gap-6">
                                <span className="font-bold text-primary text-xl">
                                    {EventService.formatPrice(event.harga)}
                                </span>
                                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full font-medium">
                                    {event.kapasitas_peserta - event.attendee_count} slot tersisa
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleViewDetails}
                                    className="h-10 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors font-semibold"
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
                                            disabled={isEventFull || isEventPassed}
                                            className="h-10 px-6 bg-primary hover:bg-teal-700 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-semibold"
                                        >
                                            {isEventPassed ? 'Sudah Lewat' : isEventFull ? 'Penuh' : 'Daftar'}
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        onClick={() => onViewDetails(event.slug)}
                                        className="h-10 px-6 bg-primary hover:bg-teal-700 text-white transition-colors font-semibold"
                                    >
                                        Login Dulu
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
