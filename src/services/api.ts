// src/services/api.ts
// Service API centralisé pour tous les appels backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TikTokUserData {
  username: string;
  displayName: string;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  verified: boolean;
  bio: string;
  avatar: string;
  monetizationStatus: {
    isEligibleForCreatorFund: boolean;
    isEligibleForLive: boolean;
    isEligibleForShop: boolean;
    estimatedEarnings: number;
  };
}

export interface GrowthData {
  growthScore: number;
  engagementRate: number;
  viralityScore: number;
  nicheSuggestion: string;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  bestPostingTimes: string[];
  weeklyGoal: {
    posts: number;
    engagement: string;
    estimatedGrowth: string;
  };
  history: Array<{ day: string; followers: number }>;
}

export interface ContentIdea {
  day: string;
  title: string;
  hook: string;
  format: string;
  hashtags: string[];
  estimatedViews: string;
}

// ═══════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }
    
    return { success: true, data: data.data || data };
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: error.message || 'Erreur de connexion au serveur',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE TIKTOK
// ═══════════════════════════════════════════════════════════════

export async function analyzeTikTok(username: string): Promise<ApiResponse<TikTokUserData>> {
  return request('POST', '/api/analyze', { username });
}

// ═══════════════════════════════════════════════════════════════
// GÉNÉRATION DE SCRIPT
// ═══════════════════════════════════════════════════════════════

export async function generateScript(params: {
  prompt: string;
  platform: string;
  tone?: string;
  duration?: string;
  language?: string;
}): Promise<ApiResponse<{ script: string; hashtags: string[] }>> {
  return request('POST', '/api/generate-script', params);
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE DE CROISSANCE
// ═══════════════════════════════════════════════════════════════

export async function analyzeGrowth(data: {
  username: string;
  followers: number;
  videos: number;
  likes: number;
}): Promise<ApiResponse<GrowthData>> {
  return request('POST', '/api/analyze-growth', data);
}

// ═══════════════════════════════════════════════════════════════
// RECOMMANDATIONS DE CONTENU
// ═══════════════════════════════════════════════════════════════

export async function recommendContent(username: string): Promise<ApiResponse<{ ideas: ContentIdea[] }>> {
  return request('POST', '/api/recommend-content', { username });
}

// ═══════════════════════════════════════════════════════════════
// AUTOMATION
// ═══════════════════════════════════════════════════════════════

export async function startAutomation(data: {
  username: string;
  action: 'likes' | 'follows';
  count: number;
}): Promise<ApiResponse<{ sessionId: string; estimated_wait: number }>> {
  return request('POST', '/api/automation/start', data);
}

export async function getAutomationStatus(sessionId: string): Promise<ApiResponse<{ currentCount: number; status: string }>> {
  return request('GET', `/api/automation/status?sessionId=${sessionId}`);
}

// ═══════════════════════════════════════════════════════════════
// ENVOI D'EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendEmail(data: {
  to: string;
  username: string;
  action: string;
  count: number;
  duration: number;
  views: number;
}): Promise<ApiResponse<{ message: string }>> {
  return request('POST', '/api/send-email', data);
}

// ═══════════════════════════════════════════════════════════════
// SANTÉ DU SERVEUR
// ═══════════════════════════════════════════════════════════════

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// PEXELS (MÉDIAS)
// ═══════════════════════════════════════════════════════════════

export async function searchPexelsVideos(query: string, perPage: number = 12): Promise<ApiResponse<any>> {
  return request('GET', `/api/pexels/search?query=${encodeURIComponent(query)}&per_page=${perPage}`);
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY (UPLOAD)
// ═══════════════════════════════════════════════════════════════

export async function getCloudinaryConfig(): Promise<ApiResponse<{ cloudName: string; uploadPreset: string; uploadUrl: string }>> {
  return request('GET', '/api/cloudinary/config');
}

// ═══════════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════

export default {
  analyzeTikTok,
  generateScript,
  analyzeGrowth,
  recommendContent,
  startAutomation,
  getAutomationStatus,
  sendEmail,
  checkHealth,
  searchPexelsVideos,
  getCloudinaryConfig,
};