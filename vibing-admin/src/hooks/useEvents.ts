"use client";

import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types';
import { fetchEvents } from '@/services/eventService';
import { getErrorMessage } from '@/utils/errorMessages';

interface UseEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  upcoming?: boolean;
  category?: string;
  time_range?: 'today' | 'this_week' | 'this_month' | 'next_month';
  status?: 'upcoming' | 'ongoing' | 'completed';
}

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
  } | null;
  refetch: () => Promise<void>;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updatedEvent: Partial<Event>) => void;
  removeEvent: (id: string) => void;
}

export function useEvents(params: UseEventsParams = {}): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchEvents(params);
      setEvents(result);
      setMeta({ page: 1, limit: params?.limit || 10, total: result.length });
    } catch (err) {
      const errorMessage = getErrorMessage(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.search, params.upcoming, params.category, params.time_range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const addEvent = useCallback((event: Event) => {
    setEvents(prev => [event, ...prev]);
    if (meta) {
      setMeta(prev => prev ? { ...prev, total: prev.total + 1 } : null);
    }
  }, [meta]);

  const updateEvent = useCallback((id: string, updatedEvent: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...updatedEvent } : event
    ));
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
    if (meta) {
      setMeta(prev => prev ? { ...prev, total: prev.total - 1 } : null);
    }
  }, [meta]);

  return {
    events,
    loading,
    error,
    meta,
    refetch,
    addEvent,
    updateEvent,
    removeEvent
  };
}
