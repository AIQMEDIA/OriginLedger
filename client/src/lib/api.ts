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

  getRecentActivities: async (params?: { 
    limit?: number;
    participantId?: string;
    assetId?: string;
    action?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.participantId) searchParams.set('participantId', params.participantId);
    if (params?.assetId) searchParams.set('assetId', params.assetId);
    if (params?.action) searchParams.set('action', params.action);
    
    const queryString = searchParams.toString();
    const url = `${API_BASE}/recent-activities${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // Blockchain operations with pagination
  getBlockchain: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const url = `${API_BASE}/chain${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // Chain validation
  validateChain: async () => {
    const response = await apiRequest('GET', `${API_BASE}/chain/validate`);
    return response.json();
  },

  // Asset operations with pagination
  getAssets: async (params?: { 
    status?: string; 
    search?: string; 
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
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

  // Chatbot
  sendChatMessage: async (message: string) => {
    const response = await apiRequest('POST', `${API_BASE}/chatbot`, { message });
    return response.json();
  },

  // Audit and compliance
  getAuditLog: async (params?: {
    startDate?: string;
    endDate?: string;
    participantId?: string;
    assetId?: string;
    format?: 'json' | 'csv';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.participantId) searchParams.set('participantId', params.participantId);
    if (params?.assetId) searchParams.set('assetId', params.assetId);
    if (params?.format) searchParams.set('format', params.format);
    
    const queryString = searchParams.toString();
    const url = `${API_BASE}/audit-log${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest('GET', url);
    return params?.format === 'csv' ? response.text() : response.json();
  },
};
