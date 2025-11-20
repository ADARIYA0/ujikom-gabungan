import { ApiClient } from '@/utils/apiClient';

export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data?: {
    paymentId: number;
    status: string;
    invoiceUrl: string | null;
    qrCodeUrl: string | null;
    amount: number;
    expiresAt: string;
  };
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    paymentId: number;
    status: string;
    amount: number;
    invoiceUrl: string | null;
    qrCodeUrl: string | null;
    paidAt: string | null;
    expiresAt: string | null;
  };
  error?: string;
}

export interface PendingPayment {
  paymentId: number;
  status: string;
  amount: number;
  invoiceUrl: string | null;
  qrCodeUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  paidAt: string | null;
  event: {
    id: number;
    judul_kegiatan: string;
    slug: string;
    lokasi_kegiatan: string;
    waktu_mulai: string;
    waktu_berakhir: string;
    kategori: {
      id: number;
      nama_kategori: string;
      slug: string;
    } | null;
  } | null;
}

export interface PendingPaymentsResponse {
  success: boolean;
  message: string;
  data?: PendingPayment[];
  error?: string;
}

export class PaymentService {
  /**
   * Create payment invoice for event registration
   * Supports both eventId (for paid events without attendance) and attendanceId (for existing attendance)
   */
  static async createPayment(attendanceId: number | null, eventId: number | null = null): Promise<CreatePaymentResponse> {
    try {
      const body: { attendanceId?: number; eventId?: number } = {};
      if (attendanceId) body.attendanceId = attendanceId;
      if (eventId) body.eventId = eventId;

      const result = await ApiClient.request<{ message: string; data: CreatePaymentResponse['data'] }>(
        '/payment/create',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      if (result.success && result.data) {
        // Backend returns { message, data: { paymentId, ... } }
        // ApiClient wraps it as { success: true, data: { message, data: {...} }, message }
        return {
          success: true,
          message: result.data.message || result.message || 'Invoice pembayaran berhasil dibuat',
          data: result.data.data, // Access nested data property
        };
      }

      throw new Error(result.error || 'Gagal membuat invoice pembayaran');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal membuat invoice pembayaran',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
    try {
      const result = await ApiClient.request<{ message: string; data: PaymentStatusResponse['data'] }>(
        `/payment/${paymentId}/status`,
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        // Backend returns { message, data: { paymentId, ... } }
        // ApiClient wraps it as { success: true, data: { message, data: {...} }, message }
        return {
          success: true,
          message: result.data.message || result.message || 'Status pembayaran berhasil diambil',
          data: result.data.data, // Access nested data property
        };
      }

      throw new Error(result.error || 'Gagal mengambil status pembayaran');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal mengambil status pembayaran',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payment by event ID
   */
  static async getPaymentByEventId(eventId: number): Promise<PaymentStatusResponse> {
    try {
      const result = await ApiClient.request<{ message: string; data: PaymentStatusResponse['data'] }>(
        `/payment/event/${eventId}`,
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        return {
          success: true,
          message: result.data.message || result.message || 'Pembayaran berhasil diambil',
          data: result.data.data, // Access nested data property
        };
      }

      throw new Error(result.error || 'Gagal mengambil pembayaran');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal mengambil pembayaran',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all pending payments for current user
   */
  static async getPendingPayments(): Promise<PendingPaymentsResponse> {
    try {
      const result = await ApiClient.request<{ message: string; data: PendingPayment[] }>(
        '/payment/pending',
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        return {
          success: true,
          message: result.data.message || result.message || 'Pembayaran pending berhasil diambil',
          data: result.data.data, // Access nested data property
        };
      }

      throw new Error(result.error || 'Gagal mengambil pembayaran pending');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal mengambil pembayaran pending',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all payments (including paid) for current user
   */
  static async getAllPayments(): Promise<PendingPaymentsResponse> {
    try {
      const result = await ApiClient.request<{ message: string; data: PendingPayment[] }>(
        '/payment/all',
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        return {
          success: true,
          message: result.data.message || result.message || 'Semua pembayaran berhasil diambil',
          data: result.data.data, // Access nested data property
        };
      }

      throw new Error(result.error || 'Gagal mengambil semua pembayaran');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal mengambil semua pembayaran',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format amount to currency
   */
  static formatAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Rp ${numAmount.toLocaleString('id-ID')}`;
  }
}

