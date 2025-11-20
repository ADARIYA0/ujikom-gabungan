const API_BASE_URL = process.env.NEXT_PUBLIC_API_KEY;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_KEY is not defined in environment variables');
}

interface GlobalTemplate {
  id: number;
  name: string;
  description?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  elements: any[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    email: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginatedResponse {
  templates: GlobalTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class GlobalCertificateTemplateService {
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      
      // Handle specific error codes
      if (response.status === 413) {
        errorMessage = 'File too large. Please use a smaller image or compress the image before uploading.';
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }
      }

      throw new Error(errorMessage);
    }

    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }

    return data.data as T;
  }

  static async getGlobalCertificateTemplates(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    isDefault?: boolean;
  }): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const url = new URL(`${API_BASE_URL}/global-certificate-templates`);
      
      if (params?.page) {
        url.searchParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        url.searchParams.append('limit', params.limit.toString());
      }
      if (params?.isActive !== undefined) {
        url.searchParams.append('isActive', params.isActive.toString());
      }
      if (params?.isDefault !== undefined) {
        url.searchParams.append('isDefault', params.isDefault.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<PaginatedResponse>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }

  static async getGlobalCertificateTemplateById(templateId: number): Promise<ApiResponse<GlobalTemplate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates/${templateId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<GlobalTemplate>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }

  static async getDefaultGlobalCertificateTemplate(): Promise<ApiResponse<GlobalTemplate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates/default`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<GlobalTemplate>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }

  static async createGlobalCertificateTemplate(templateData: {
    name: string;
    description?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    elements: any[];
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<ApiResponse<GlobalTemplate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(templateData),
      });

      const result = await this.handleResponse<GlobalTemplate>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }

  static async updateGlobalCertificateTemplate(
    templateId: number,
    templateData: {
      name?: string;
      description?: string;
      backgroundImage?: string;
      backgroundSize?: string;
      elements?: any[];
      isDefault?: boolean;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<GlobalTemplate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates/${templateId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(templateData),
      });

      const result = await this.handleResponse<GlobalTemplate>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }

  static async deleteGlobalCertificateTemplate(templateId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates/${templateId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const data: ApiResponse<void> = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async setDefaultGlobalCertificateTemplate(templateId: number): Promise<ApiResponse<GlobalTemplate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates/${templateId}/set-default`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<GlobalTemplate>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }

  static async getTemplateUsageStats(templateId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/global-certificate-templates/${templateId}/stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<any>(response);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      throw error;
    }
  }
}

export default GlobalCertificateTemplateService;
export type { GlobalTemplate, ApiResponse, PaginatedResponse };

