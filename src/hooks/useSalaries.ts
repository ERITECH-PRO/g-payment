import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Salary, SalaryFormData } from '@/types/database';
import { toast } from 'sonner';
import { getCurrentMonthYear } from '@/lib/constants';
import { API_URL } from '@/config/api';

interface SalaryFilters {
  year?: number;
  month?: number;
}

export function useSalaries(filters?: SalaryFilters) {
  const queryClient = useQueryClient();
  const { year, month } = filters ?? getCurrentMonthYear();

  const { data: salaries = [], isLoading, error } = useQuery({
    queryKey: ['salaries', year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());

      const response = await fetch(`${API_URL}/salaries?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch salaries');
      }
      return response.json() as Promise<Salary[]>;
    },
  });

  const createSalary = useMutation({
    mutationFn: async (formData: SalaryFormData) => {
      const response = await fetch(`${API_URL}/salaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          prime: formData.prime ?? 0,
          absence: formData.absence ?? 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create salary');
      }
      return response.json() as Promise<Salary>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salaire enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateSalary = useMutation({
    mutationFn: async ({ id, ...formData }: SalaryFormData & { id: string }) => {
      const response = await fetch(`${API_URL}/salaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          prime: formData.prime ?? 0,
          absence: formData.absence ?? 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update salary');
      }
      return response.json() as Promise<Salary>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salaire mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteSalary = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/salaries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete salary');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salaire supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    salaries,
    isLoading,
    error,
    createSalary,
    updateSalary,
    deleteSalary,
  };
}
