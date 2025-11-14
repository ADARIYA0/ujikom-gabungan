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

  static getImageUrl(imagePath: string): string {
    if (!imagePath) return '/event/default-event.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    return `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/events/${imagePath}`;
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

}
