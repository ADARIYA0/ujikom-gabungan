// Types untuk API Event sesuai dengan Backend structure

export interface EventCategory {
  id: number;
  nama_kategori: string;
  slug: string;
}

export interface CreateEventPayload {
  judul_kegiatan: string;
  slug?: string;
  deskripsi_kegiatan: string;
  lokasi_kegiatan: string;
  kapasitas_peserta?: number;
  harga?: number;
  waktu_mulai: string; // ISO 8601 format
  waktu_berakhir: string; // ISO 8601 format
  kategori_id?: number;
  kategori_slug?: string;
}

export interface CreateEventFormData extends CreateEventPayload {
  flyer_kegiatan?: File | string;
  gambar_kegiatan?: File | string;
  sertifikat_kegiatan?: File | string;
}

export interface CreateEventResponse {
  message: string;
  data: {
    id: number;
    judul_kegiatan: string;
    slug: string;
    waktu_mulai: string;
    waktu_berakhir: string;
  };
}

export interface EventApiError {
  message: string;
  errors?: Array<{
    type: string;
    value: any;
    msg: string;
    path: string;
    location: string;
  }>;
}

export interface EventFormValidation {
  judul_kegiatan: string;
  deskripsi_kegiatan: string;
  lokasi_kegiatan: string;
  waktu_mulai: string;
  waktu_berakhir: string;
  kapasitas_peserta: number;
  harga: number;
}

export interface EventFormErrors {
  judul_kegiatan?: string;
  deskripsi_kegiatan?: string;
  lokasi_kegiatan?: string;
  waktu_mulai?: string;
  waktu_berakhir?: string;
  kapasitas_peserta?: string;
  harga?: string;
  kategori_id?: string;
  flyer_kegiatan?: string;
  gambar_kegiatan?: string;
  sertifikat_kegiatan?: string;
  general?: string;
}
