import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Salary, SalaryFormData } from '@/types/database';
import { toast } from 'sonner';
import { getCurrentMonthYear } from '@/lib/constants';

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
      let query = supabase
        .from('salaries')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('created_at', { ascending: false });
      
      if (year) {
        query = query.eq('year', year);
      }
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Salary[];
    },
  });

  const createSalary = useMutation({
    mutationFn: async (formData: SalaryFormData) => {
      const { data, error } = await supabase
        .from('salaries')
        .insert([{
          employee_id: formData.employee_id,
          year: formData.year,
          month: formData.month,
          salaire: formData.salaire,
          prime: formData.prime ?? 0,
        }])
        .select(`
          *,
          employee:employees(*)
        `)
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Un salaire existe déjà pour cet employé ce mois-ci');
        }
        throw error;
      }
      return data as Salary;
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
      const { data, error } = await supabase
        .from('salaries')
        .update({
          employee_id: formData.employee_id,
          year: formData.year,
          month: formData.month,
          salaire: formData.salaire,
          prime: formData.prime ?? 0,
        })
        .eq('id', id)
        .select(`
          *,
          employee:employees(*)
        `)
        .single();
      
      if (error) throw error;
      return data as Salary;
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
      const { error } = await supabase
        .from('salaries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
