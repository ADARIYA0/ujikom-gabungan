export function getErrorMessage(error: string | Error): string {
  const errorString = error instanceof Error ? error.message : error;
  
  switch (errorString) {
    case 'NETWORK_ERROR':
      return 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil dan coba lagi.';
    
    case 'SERVER_ERROR':
      return 'Server sedang tidak dapat diakses. Silakan coba lagi beberapa saat lagi.';
    
    case 'API_ERROR':
      return 'Terjadi masalah saat memproses data. Silakan coba lagi beberapa saat lagi.';
    
    case 'TIMEOUT_ERROR':
      return 'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.';
    
    default:
      return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi beberapa saat lagi.';
  }
}

export function getErrorTitle(error: string | Error): string {
  const errorString = error instanceof Error ? error.message : error;
  
  switch (errorString) {
    case 'NETWORK_ERROR':
      return 'Masalah Koneksi';
    
    case 'SERVER_ERROR':
      return 'Server Tidak Tersedia';
    
    case 'API_ERROR':
      return 'Masalah Pemrosesan Data';
    
    case 'TIMEOUT_ERROR':
      return 'Koneksi Timeout';
    
    default:
      return 'Terjadi Kesalahan';
  }
}
