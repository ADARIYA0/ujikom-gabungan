/**
 * Category Service for fetching category data from backend API
 * Compatible with Next.js 15.5.4, React v19.1, TypeScript null-safety
 */

export interface Category {
    id: number;
    nama_kategori: string;
    slug: string;
    kategori_logo: string;
    kategori_logo_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface CategoryResponse {
    data: Category[];
}

class CategoryService {
    private readonly baseUrl: string;

    constructor() {
        // Use environment variable, never hardcode URLs
        this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        if (!this.baseUrl) {
          console.warn('NEXT_PUBLIC_BASE_URL environment variable is not set');
        }
    }

    /**
     * Fetch all categories from backend API
     * @returns Promise<Category[]> Array of categories
     */
    async getAllCategories(): Promise<Category[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/category`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store', // Ensure fresh data for each request
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
            console.error('Error fetching categories:', error);

            // Return fallback categories with proper image URLs
            return this.getFallbackCategories();
        }
    }

    /**
     * Get categories specifically for Hero section (increased to show more cards)
     * @returns Promise<Category[]> Array of categories for Hero
     */
    async getCategoriesForHero(): Promise<Category[]> {
        try {
            const categories = await this.getAllCategories();

            // Increased limit to show more category cards (up to 10 categories)
            return categories.slice(0, 10);
        } catch (error) {
            console.error('Error fetching categories for Hero:', error);
            return this.getFallbackCategories();
        }
    }

    /**
     * Get fallback categories when API fails (expanded to match database)
     * @returns Category[] Array of fallback categories
     */
    private getFallbackCategories(): Category[] {
        const fallbackCategories: Category[] = [
            {
                id: 1,
                nama_kategori: 'Workshop',
                slug: 'workshop',
                kategori_logo: 'workshop.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/workshop.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                nama_kategori: 'Seminar',
                slug: 'seminar',
                kategori_logo: 'seminar.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/seminar.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                nama_kategori: 'Pelatihan',
                slug: 'pelatihan',
                kategori_logo: 'pelatihan.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/pelatihan.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 4,
                nama_kategori: 'Webinar',
                slug: 'webinar',
                kategori_logo: 'webinar.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/webinar.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 5,
                nama_kategori: 'Konferensi',
                slug: 'konferensi',
                kategori_logo: 'konferensi.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/konferensi.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 6,
                nama_kategori: 'Kompetisi',
                slug: 'kompetisi',
                kategori_logo: 'kompetisi.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/kompetisi.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 7,
                nama_kategori: 'Lomba',
                slug: 'lomba',
                kategori_logo: 'lomba.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/lomba.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 8,
                nama_kategori: 'Pameran',
                slug: 'pameran',
                kategori_logo: 'pameran.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/pameran.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 9,
                nama_kategori: 'Diskusi',
                slug: 'diskusi',
                kategori_logo: 'diskusi.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/diskusi.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 10,
                nama_kategori: 'Sosialisasi',
                slug: 'sosialisasi',
                kategori_logo: 'sosialisasi.jpg',
                kategori_logo_url: `${this.baseUrl}/uploads/categories/sosialisasi.jpg`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        return fallbackCategories;
    }

    /**
     * Get category by slug
     * @param slug Category slug
     * @returns Promise<Category | null> Category or null if not found
     */
    async getCategoryBySlug(slug: string): Promise<Category | null> {
        try {
            const categories = await this.getAllCategories();
            return categories.find(cat => cat.slug === slug) || null;
        } catch (error) {
            console.error('Error fetching category by slug:', error);
            return null;
        }
    }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;
