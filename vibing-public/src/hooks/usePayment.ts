'use client';

import { useState, useEffect } from 'react';
import { PaymentService, CreatePaymentResponse, PaymentStatusResponse } from '@/services/paymentService';

export function usePayment(attendanceId: number | null, eventId: number | null = null) {
  const [payment, setPayment] = useState<CreatePaymentResponse['data'] | null>(null);
  const [status, setStatus] = useState<PaymentStatusResponse['data'] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (): Promise<CreatePaymentResponse> => {
    if (!attendanceId && !eventId) {
      return {
        success: false,
        message: 'Event ID atau Attendance ID tidak ditemukan',
        error: 'Event ID or Attendance ID required'
      };
    }

    try {
      setIsCreating(true);
      setError(null);

      const result = await PaymentService.createPayment(attendanceId, eventId);

      if (result.success && result.data) {
        setPayment(result.data);
        return result;
      }

      setError(result.error || result.message);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat pembayaran';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    } finally {
      setIsCreating(false);
    }
  };

  const checkPaymentStatus = async (paymentId: number): Promise<PaymentStatusResponse> => {
    try {
      setIsChecking(true);
      setError(null);

      const result = await PaymentService.getPaymentStatus(paymentId);

      if (result.success && result.data) {
        setStatus(result.data);
        return result;
      }

      setError(result.error || result.message);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memeriksa status pembayaran';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    } finally {
      setIsChecking(false);
    }
  };

  // No auto-polling - user will check status manually via button

  return {
    payment,
    status,
    isCreating,
    isChecking,
    error,
    createPayment,
    checkPaymentStatus
  };
}

