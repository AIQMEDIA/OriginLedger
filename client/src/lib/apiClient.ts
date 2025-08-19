// Enhanced API client with JWT authentication support
export interface AuthUser {
  id: string;
  username: string;
  role: string;
  email?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: any;
}

class ApiClient {
  private baseURL = '';
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Make authenticated API requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Authentication required. Please log in again.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // Store the token
    this.setToken(response.token);
    return response;
  }

  async register(
    username: string, 
    password: string, 
    role: string, 
    email: string
  ): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ 
        user: username, 
        password, 
        role, 
        email 
      }),
    });
    
    // Store the token for immediate login
    this.setToken(response.token);
    return response;
  }

  async getProfile(): Promise<AuthUser> {
    return this.request<AuthUser>('/api/auth/me');
  }

  async setPassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request('/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Asset methods with enhanced filtering
  async getAssets(filters: {
    status?: string;
    search?: string;
    category?: string;
    batch?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'currentStatus';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const endpoint = `/api/assets${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // Blockchain methods
  async getBlockchain(page?: number, limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/chain${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async validateChain(): Promise<any> {
    return this.request('/api/chain/validate');
  }

  // Event creation
  async addEvent(eventData: {
    user: string;
    action: string;
    asset_id: string;
    meta?: any;
  }): Promise<any> {
    return this.request('/api/add-event', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Participants
  async getParticipants(): Promise<any> {
    return this.request('/api/participants');
  }

  // Dashboard and statistics
  async getDashboardStats(): Promise<any> {
    return this.request('/api/dashboard-stats');
  }

  async getRecentActivities(): Promise<any> {
    return this.request('/api/recent-activities');
  }

  async getAuditLog(): Promise<any> {
    return this.request('/api/audit-log');
  }

  // Health check
  async getHealth(): Promise<any> {
    return this.request('/api/health');
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Logout
  logout(): void {
    this.clearToken();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  login,
  register,
  getProfile,
  setPassword,
  getAssets,
  getBlockchain,
  validateChain,
  addEvent,
  getParticipants,
  getDashboardStats,
  getRecentActivities,
  getAuditLog,
  getHealth,
  isAuthenticated,
  logout,
} = apiClient;

export default apiClient;