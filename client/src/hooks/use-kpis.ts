import { useQuery } from '@tanstack/react-query';
import { AuthManager } from '@/lib/auth';
import type { KpiData, KpiDetailData, FilterParams, Client, Provider } from '@shared/schema';

export function useKpiOverview(filters: FilterParams) {
  return useQuery({
    queryKey: ['/api/v1/kpis/overview', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/v1/kpis/overview?${params}`, {
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch KPI overview');
      }

      return response.json() as Promise<KpiData[]>;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

export function useKpiDetail(code: string, filters: FilterParams, enabled = false) {
  return useQuery({
    queryKey: ['/api/v1/kpis', code, 'detail', filters],
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/v1/kpis/${code}/detail?${params}`, {
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch KPI detail');
      }

      return response.json() as Promise<KpiDetailData>;
    },
  });
}

export function useClients() {
  return useQuery({
    queryKey: ['/api/v1/clients'],
    queryFn: async () => {
      const response = await fetch('/api/v1/clients', {
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      return response.json() as Promise<Client[]>;
    },
  });
}

export function useProviders() {
  return useQuery({
    queryKey: ['/api/v1/providers'],
    queryFn: async () => {
      const response = await fetch('/api/v1/providers', {
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      return response.json() as Promise<Provider[]>;
    },
  });
}

export function exportKpiData(code: string, filters: FilterParams) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  params.append('format', 'csv');

  const url = `/api/v1/kpis/${code}/export?${params}`;
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `${code}_detail.csv`;
  
  // Add auth headers by creating a temporary form
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = url;
  form.style.display = 'none';
  
  // Add auth token as hidden input
  const token = AuthManager.getToken();
  if (token) {
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
  }
  
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
