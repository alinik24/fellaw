import { getAccessToken } from './platform';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LawyerSearchResult {
  id: string;
  user_full_name: string | null;
  title: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  review_count: number;
  hourly_rate: number | null;
  offers_free_consultation: boolean;
  verified: boolean;
  city: string | null;
  law_firm_name: string | null;
  bio_snippet: string | null;
}

export interface LawyerSearchFilters {
  specialization?: string;
  city?: string;
  language?: string;
  max_rate?: number;
  verified_only?: boolean;
  offers_free?: boolean;
}

export async function searchLawyers(filters: LawyerSearchFilters = {}): Promise<LawyerSearchResult[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const response = await fetch(`${API_BASE_URL}/api/v1/professionals/lawyers?${params.toString()}`, {
    headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.detail || response.statusText) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<LawyerSearchResult[]>;
}
