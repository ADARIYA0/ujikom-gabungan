"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  Activity,
  Star,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Event } from '../types';
import { useEvents } from '../hooks/useEvents';
import ErrorAlert from './ErrorAlert';
import EventFormDialog from './ui/event-form-dialog';


export default function Dashboard() {
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const router = useRouter();
  const { events, loading, error, refetch, addEvent } = useEvents({ limit: 10 });

  const totalEvents = events.length;
  const upcomingEvents = events.filter((event: Event) => event.status === 'upcoming').slice(0, 5);
  const ongoingEvents = events.filter((event: Event) => event.status === 'ongoing');
  const completedEvents = events.filter((event: Event) => event.status === 'completed');

  const totalParticipants = events.reduce((sum: number, event: Event) => sum + event.participants, 0);

  const currentMonth = new Date().getMonth();
  const monthlyStats = [
    { month: 'Jan', events: 0, participants: 0 },
    { month: 'Feb', events: 0, participants: 0 },
    { month: 'Mar', events: 0, participants: 0 },
    { month: 'Apr', events: 0, participants: 0 },
    { month: 'May', events: 0, participants: 0 },
    { month: 'Jun', events: 0, participants: 0 },
    { month: 'Jul', events: 0, participants: 0 },
    { month: 'Aug', events: 0, participants: 0 },
    { month: 'Sep', events: 0, participants: 0 },
    { month: 'Oct', events: 0, participants: 0 },
    { month: 'Nov', events: 0, participants: 0 },
    { month: 'Dec', events: 0, participants: 0 }
  ];

  monthlyStats[currentMonth] = {
    month: monthlyStats[currentMonth].month,
    events: events.filter((event: Event) => new Date(event.date).getMonth() === currentMonth).length,
    participants: events
      .filter((event: Event) => new Date(event.date).getMonth() === currentMonth)
      .reduce((sum: number, event: Event) => sum + event.participants, 0)
  };

  const maxParticipants = Math.max(...monthlyStats.map(stat => stat.participants), 1);
  const thisMonthEvents = monthlyStats[currentMonth].events;
  const thisMonthParticipants = monthlyStats[currentMonth].participants;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status: Event['status']) => {
    const statusConfig = {
      upcoming: { label: 'Akan Datang', className: 'bg-blue-100 text-blue-800' },
      ongoing: { label: 'Berlangsung', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Selesai', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={`${config.className} border-0 text-xs`}>
        {config.label}
      </Badge>
    );
  };

  // Quick Actions Handlers
  const handleCreateEvent = (eventData: any) => {
    addEvent(eventData);
    // Refresh data after creating event
    refetch();
  };

  const handleNavigateToEvents = () => {
    router.push('/events');
  };

  const handleOpenCreateEventDialog = () => {
    setShowCreateEventDialog(true);
  };

  return (
    <div className="space-y-8">
      <div
        className="relative rounded-2xl p-8 text-white overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(13, 148, 136, 0.85), rgba(13, 148, 136, 0.85)), url('https://images.unsplash.com/photo-1665491961263-2c9f8deebf63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbmZlcmVuY2UlMjBldmVudCUyMGF1ZGl0b3JpdW18ZW58MXx8fHwxNzU3MzIzNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl mb-2 font-bold">Selamat Datang di PlanHub!</h1>
            <p className="text-teal-100 text-base md:text-lg">
              Kelola event Anda dengan mudah dan profesional
            </p>
          </div>
          <div className="flex flex-col items-end text-right gap-2">
            <div className="text-lg md:text-2xl">{new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</div>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-teal-100 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {error && (
        <ErrorAlert
          error={error}
          onRetry={refetch}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Event</CardTitle>
            <Calendar className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">
                  {completedEvents.length} selesai, {upcomingEvents.length} akan datang
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalParticipants}</div>
                <p className="text-xs text-muted-foreground">
                  Semua event
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{thisMonthEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {thisMonthParticipants} peserta
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Peserta</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {events.length > 0 ? Math.round(totalParticipants / events.length) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per event
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-teal-600" />
                  Event Mendatang
                </CardTitle>
                <CardDescription>
                  Event yang akan segera berlangsung
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    {event.imageUrl && event.imageUrl !== '/placeholder-event.jpg' && (
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <h4 className="font-medium text-sm line-clamp-2">{event.title}</h4>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-teal-600 flex-shrink-0" />
                          <span className="truncate">{formatDate(event.date)} • {event.time} WIB</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-teal-600 flex-shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-teal-600 flex-shrink-0" />
                          <span>{event.participants} peserta</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-3">Tidak ada event mendatang</p>
                  <Button
                    onClick={handleOpenCreateEventDialog}
                    variant="outline"
                    size="sm"
                    className="border-teal-300 text-teal-700 hover:bg-teal-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                  >
                    Buat Event Pertama
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-teal-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleOpenCreateEventDialog}
                className="w-full justify-start bg-teal-600 hover:bg-teal-700 text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Event Baru
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-teal-300 text-teal-700 hover:bg-teal-50 transition-all duration-200"
                disabled
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Lihat Statistik
              </Button>
              <Button
                onClick={handleNavigateToEvents}
                variant="outline"
                className="w-full justify-start border-teal-300 text-teal-700 hover:bg-teal-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Kelola Event
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Terpopuler</CardTitle>
              <CardDescription>Event dengan peserta terbanyak</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : events.length > 0 ? (
                (() => {
                  const topEvent = events.reduce((max: Event, event: Event) =>
                    event.participants > max.participants ? event : max
                  );
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{topEvent.title}</p>
                          <p className="text-xs text-gray-600">{topEvent.participants} peserta</p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-500">Belum ada data event</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EventFormDialog
        open={showCreateEventDialog}
        onOpenChange={setShowCreateEventDialog}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
}
