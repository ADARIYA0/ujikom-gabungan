import { useState, useEffect } from 'react';
import { UserEventService, MyEvent, EventHistory } from '@/services/userEventService';
import { PaymentService, PendingPayment } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';

export function useMyEvents() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchEvents = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await UserEventService.getMyEvents();
      // Ensure data is always an array
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Gagal memuat event saya');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isLoggedIn]);

  const refetch = () => {
    fetchEvents();
  };

  return {
    events,
    loading,
    error,
    refetch
  };
}

export function useEventHistory() {
  const [events, setEvents] = useState<EventHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchHistory = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await UserEventService.getEventHistory();
      // Ensure data is always an array
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Gagal memuat riwayat kegiatan');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isLoggedIn]);

  const refetch = () => {
    fetchHistory();
  };

  return {
    events,
    loading,
    error,
    refetch
  };
}

export function usePendingPayments() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchPayments = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      setPayments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Get all payments (including paid) instead of just pending
      const result = await PaymentService.getAllPayments();
      if (result.success && result.data) {
        setPayments(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || 'Gagal memuat pembayaran');
        setPayments([]);
      }
    } catch (err) {
      setError('Gagal memuat pembayaran');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [isLoggedIn]);

  const refetch = () => {
    fetchPayments();
  };

  return {
    payments,
    loading,
    error,
    refetch
  };
}

