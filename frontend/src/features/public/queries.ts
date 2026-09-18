import { useQuery } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';
import type {
  CategoryView,
  DayAvailability,
  PageResponse,
  ProductView,
  ServiceView,
  WorkingHoursView,
} from '@/lib/types';

export type NextSlot = {
  startAt: string;
  endAt: string;
  serviceId: number;
  serviceName: string;
  freeBays: number;
};

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<ServiceView[]>('/api/services'),
    staleTime: 5 * 60_000,
  });
}

export function useWorkingHours() {
  return useQuery({
    queryKey: ['working-hours'],
    queryFn: () => api.get<WorkingHoursView[]>('/api/working-hours'),
    staleTime: 30 * 60_000,
  });
}

/**
 * Prvi slobodan termin. Backend vraća 204 kad ga nema — tada je `null`, što
 * naslovnica prikazuje kao „nazovite nas", a ne kao grešku.
 */
export function useNextSlot(serviceId?: number) {
  return useQuery({
    queryKey: ['availability', 'next', serviceId ?? null],
    queryFn: async () => {
      const suffix = serviceId ? `?serviceId=${serviceId}` : '';
      const result = await api.get<NextSlot | undefined>(`/api/availability/next${suffix}`);
      return result ?? null;
    },
    staleTime: 60_000,
  });
}

export function useAvailability(date: string, serviceId: number | null) {
  return useQuery({
    queryKey: ['availability', date, serviceId],
    queryFn: () => api.get<DayAvailability>(`/api/availability?date=${date}&serviceId=${serviceId}`),
    enabled: serviceId !== null,
    staleTime: 15_000,
  });
}

export function useProducts(params: { q?: string; category?: string; page: number; size?: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  search.set('page', String(params.page));
  search.set('size', String(params.size ?? 12));

  return useQuery({
    queryKey: ['products', params.q ?? '', params.category ?? '', params.page, params.size ?? 12],
    queryFn: () => api.get<PageResponse<ProductView>>(`/api/products?${search.toString()}`),
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api.get<CategoryView[]>('/api/product-categories'),
    staleTime: 30 * 60_000,
  });
}

/** Poruka koju je sigurno pokazati korisniku, iz bilo koje greške. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Došlo je do neočekivane greške. Pokušajte ponovno.';
}
