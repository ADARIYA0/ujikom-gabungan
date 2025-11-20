import { ApiClient } from '@/utils/apiClient';
import { Event } from '@/types';

export interface MyEvent extends Event {
  attendance_status: 'hadir' | 'tidak-hadir';
  waktu_absen?: string | null;
  registered_at: string;
  is_event_started: boolean;
  is_event_passed: boolean;
}

export interface EventHistory extends Event {
  attendance_id?: number;
  attendance_status?: 'hadir' | 'tidak-hadir';
  certificate_template_id?: number | null;
  waktu_absen: string;
  completed_at: string;
}

export class UserEventService {
  static async getMyEvents(): Promise<MyEvent[]> {
    try {
      const result = await ApiClient.request<{ data: MyEvent[] }>('/user/events');

      if (result.success && result.data) {
        // Backend returns { data: events }, so result.data is { data: events }
        // We need to access result.data.data to get the actual array
        const eventsData = (result.data as any)?.data || result.data;
        const events = Array.isArray(eventsData) ? eventsData : [];
        return events;
      }

      // Return empty array instead of throwing error if no data
      return [];
    } catch (error) {
      return [];
    }
  }

  static async getEventHistory(): Promise<EventHistory[]> {
    try {
      const result = await ApiClient.request<{ data: EventHistory[] }>('/user/events/history');

      if (result.success && result.data) {
        // Backend returns { data: events }, so result.data is { data: events }
        // We need to access result.data.data to get the actual array
        const eventsData = (result.data as any)?.data || result.data;
        const events = Array.isArray(eventsData) ? eventsData : [];
        return events;
      }

      // Return empty array instead of throwing error if no data
      return [];
    } catch (error) {
      return [];
    }
  }
}

