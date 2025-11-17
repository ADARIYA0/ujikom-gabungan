export interface EventCategory {
  id: number;
  nama_kategori: string;
  slug: string;
}

export interface Event {
  id: number;
  judul_kegiatan: string;
  slug: string;
  deskripsi_kegiatan: string;
  lokasi_kegiatan: string;
  flyer_kegiatan: string;
  gambar_kegiatan: string;
  kapasitas_peserta: number;
  harga: number | string | null;
  waktu_mulai: string;
  waktu_berakhir: string;
  kategori: EventCategory | null;
  attendee_count: number;
  is_full: boolean;
  is_registered?: boolean;
  attendance_status?: 'hadir' | 'tidak-hadir' | null;
}

export interface EventsResponse {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: Event[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export interface Filters {
  category: string;
  dateRange: string;
}
