// API Response Types
export interface ApiEvent {
  id: number;
  judul_kegiatan: string;
  slug: string;
  deskripsi_kegiatan: string;
  lokasi_kegiatan: string;
  flyer_kegiatan: string | null;
  sertifikat_kegiatan: string | null;
  kapasitas_peserta: number;
  harga: number;
  waktu_mulai: string;
  waktu_berakhir: string;
  kategori: {
    id: number;
    nama_kategori: string;
    slug: string;
  } | null;
  attendee_count: number;
  is_full: boolean;
}

export interface ApiEventResponse {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: ApiEvent[];
}

export interface ApiSingleEventResponse {
  id: number;
  judul_kegiatan: string;
  slug: string;
  deskripsi_kegiatan: string;
  lokasi_kegiatan: string;
  flyer_kegiatan: string | null;
  sertifikat_kegiatan: string | null;
  kapasitas_peserta: number;
  harga: number;
  waktu_mulai: string;
  waktu_berakhir: string;
  kategori: {
    id: number;
    nama_kategori: string;
    slug: string;
  } | null;
  attendee_count: number;
  is_full: boolean;
}
