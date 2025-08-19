import { apiRequest } from './queryClient';

const API_BASE = '/api';

export const api = {
  // Participant operations
  register: async (data: { user: string; role: string }) => {
    const response = await apiRequest('POST', `${API_BASE}/register`, data);
    return response.json();
  },

  getParticipants: async () => {
    const response = await apiRequest('GET', `${API_BASE}/participants`);
    return response.json();
  },

  getParticipantsList: async () => {
    const response = await apiRequest('GET', `${API_BASE}/participants-list`);
    return response.json();
  },

  getParticipantStats: async () => {
    const response = await apiRequest('GET', `${API_BASE}/participant-stats`);
    return response.json();
  },

  // Event operations
  addEvent: async (data: {
    user: string;
    action: string;
    asset_id: string;
    meta?: any;
  }) => {
    const response = await apiRequest('POST', `${API_BASE}/add-event`, data);
    return response.json();
  },

  getRecentActivities: async (limit = 10) => {
    const response = await apiRequest('GET', `${API_BASE}/recent-activities?limit=${limit}`);
    return response.json();
  },

  // Blockchain operations
  getBlockchain: async () => {
    const response = await apiRequest('GET', `${API_BASE}/chain`);
    return response.json();
  },

  // Asset operations
  getAssets: async (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    
    const queryString = searchParams.toString();
    const url = `${API_BASE}/assets${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  },

  getAsset: async (assetId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/assets/${assetId}`);
    return response.json();
  },

  // Dashboard operations
  getDashboardStats: async () => {
    const response = await apiRequest('GET', `${API_BASE}/dashboard-stats`);
    return response.json();
  },

  // Health check
  getHealth: async () => {
    const response = await apiRequest('GET', `${API_BASE}/health`);
    return response.json();
  },
};
