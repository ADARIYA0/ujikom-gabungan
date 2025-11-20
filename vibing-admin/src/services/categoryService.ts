/**
 * Category Service for Admin Panel
 * Fetches categories from backend API
 */

export interface Category {
  id: number;
  nama_kategori: string;
  slug: string;
  kategori_logo?: string | null;
  kategori_logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryResponse {
  data: Category[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_KEY;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_KEY is not defined in environment variables');
}

class CategoryService {
  /**
   * Fetch all categories from backend API
   * @returns Promise<Category[]> Array of categories
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/category`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CategoryResponse = await response.json();

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid response format from categories API');
      }

      return result.data;
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;

