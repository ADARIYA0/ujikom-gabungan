import { ApiClient } from '@/utils/apiClient';
import { Event, EventsResponse, EventCategory } from '@/types';

export interface EventFilters {
  page?: number;
  limit?: number;
  category?: string; // Changed to string for slug
  search?: string;
  upcoming?: boolean;
  time_range?: string; // Added for time filtering
}

export class EventService {
  static async getAllEvents(filters: EventFilters = {}): Promise<EventsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.upcoming) params.append('upcoming', 'true');
    if (filters.time_range) params.append('time_range', filters.time_range);

    const queryString = params.toString();
    const endpoint = `/event${queryString ? `?${queryString}` : ''}`;
    
    const result = await ApiClient.request<EventsResponse>(endpoint);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error('Gagal mengambil data event');
  }

  static async getEventById(id: number): Promise<Event> {
    const result = await ApiClient.request<Event>(`/event/${id}`);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error('Event tidak ditemukan');
  }

  static async getEventBySlug(slug: string): Promise<Event> {
    const result = await ApiClient.request<Event>(`/event/slug/${slug}`);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error('Event tidak ditemukan');
  }

  static formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  static formatEventTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  }

  static formatEventDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  }

  static isSameDay(date1: string | Date, date2: string | Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  static formatPrice(price: number | string | undefined | null): string {
    // Convert to number jika berupa string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Check jika null, undefined, 0, atau NaN
    if (!numPrice || numPrice === 0 || (typeof numPrice === 'number' && isNaN(numPrice))) {
      return 'Gratis';
    }
    
    return `Rp ${numPrice.toLocaleString('id-ID')}`;
  }

  static isEventFull(event: Event): boolean {
    return event.is_full;
  }

  static isEventPassed(event: Event): boolean {
    return new Date(event.waktu_berakhir) < new Date();
  }

  static isEventStarted(event: Event): boolean {
    return new Date(event.waktu_mulai) <= new Date();
  }

  static getTimeUntilEventStart(event: Event): number {
    const startTime = new Date(event.waktu_mulai).getTime();
    const now = new Date().getTime();
    return Math.max(0, startTime - now);
  }

  static formatEventStartTime(event: Event): string {
    const startTime = new Date(event.waktu_mulai);
    return startTime.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  }

  static getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return '/event/default-event.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Backend stores flyer in /uploads/flyer/ directory
    return `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/flyer/${imagePath}`;
  }

  static getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Konferensi': 'bg-teal-50 text-teal-700 border-teal-200',
      'Workshop': 'bg-blue-50 text-blue-700 border-blue-200',
      'Seminar': 'bg-slate-50 text-slate-700 border-slate-200',
      'Meetup': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Festival': 'bg-rose-50 text-rose-700 border-rose-200',
      'Concert': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return colors[categoryName] || 'bg-gray-50 text-gray-700 border-gray-200';
  }

  static async registerEvent(eventId: number): Promise<{ 
    success: boolean; 
    message: string; 
    error?: string;
    data?: {
      eventId?: number;
      attendanceId?: number;
      requiresPayment?: boolean;
      amount?: number;
    };
  }> {
    const result = await ApiClient.request<{ message: string; data?: { eventId?: number; attendanceId?: number; requiresPayment: boolean; amount: number } }>(`/event/${eventId}/register`, {
      method: 'POST',
    });

    if (result.success && result.data) {
      // Backend returns { message, data: { eventId/attendanceId, requiresPayment, amount } }
      // ApiClient wraps it as { success: true, data: { message, data: {...} }, message }
      return {
        success: true,
        message: result.data.message || result.message || 'Berhasil mendaftar. Kode token dikirim ke email Anda.',
        data: result.data.data // Access nested data property
      };
    }

    return {
      success: false,
      message: result.error || 'Gagal mendaftar event',
      error: result.error
    };
  }

  static async checkInEvent(eventId: number, token: string): Promise<{ success: boolean; message: string; error?: string }> {
    const result = await ApiClient.request<{ message: string }>(`/event/${eventId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (result.success) {
      return {
        success: true,
        message: result.message || 'Absensi berhasil. Terima kasih.'
      };
    }

    return {
      success: false,
      message: result.error || 'Gagal melakukan absensi',
      error: result.error
    };
  }

}
