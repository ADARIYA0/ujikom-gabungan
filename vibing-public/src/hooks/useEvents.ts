import { useState, useEffect } from 'react';
import { Event, EventsResponse } from '@/types';
import { EventService, EventFilters } from '@/services/eventService';

export function useEvents(filters: EventFilters = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const fetchEvents = async (newFilters: EventFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = { ...filters, ...newFilters };
      const response = await EventService.getAllEvents(mergedFilters);
      
      setEvents(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError('Gagal memuat data event');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const refetch = (newFilters?: EventFilters) => {
    fetchEvents(newFilters);
  };

  return {
    events,
    loading,
    error,
    meta,
    refetch
  };
}

export function useEvent(id: number) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventData = await EventService.getEventById(id);
        setEvent(eventData);
      } catch (err) {
        setError('Event tidak ditemukan');
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  return {
    event,
    loading,
    error
  };
}

export function useEventBySlug(slug: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventData = await EventService.getEventBySlug(slug);
        setEvent(eventData);
      } catch (err) {
        setError('Event tidak ditemukan');
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const refetch = async () => {
    if (slug) {
      try {
        setLoading(true);
        setError(null);
        const eventData = await EventService.getEventBySlug(slug);
        setEvent(eventData);
      } catch (err) {
        setError('Event tidak ditemukan');
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    event,
    loading,
    error,
    refetch
  };
}

export function useEventRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerEvent = async (eventId: number): Promise<{ success: boolean; message: string }> => {
    try {
      setIsRegistering(true);
      setError(null);

      const result = await EventService.registerEvent(eventId);

      if (!result.success) {
        setError(result.error || result.message);
        return result;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mendaftar event';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerEvent,
    isRegistering,
    error
  };
}

export function useEventCheckIn() {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInEvent = async (eventId: number, token: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsCheckingIn(true);
      setError(null);

      const result = await EventService.checkInEvent(eventId, token);

      if (!result.success) {
        setError(result.error || result.message);
        return result;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal melakukan absensi';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsCheckingIn(false);
    }
  };

  return {
    checkInEvent,
    isCheckingIn,
    error
  };
}
