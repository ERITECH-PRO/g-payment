import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Employee, EmployeeFormData } from '@/types/database';
import { toast } from 'sonner';

export function useEmployees() {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Employee[];
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (formData: EmployeeFormData) => {
      // Le code est généré automatiquement par trigger, on utilise une valeur placeholder
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          code: 'TEMP', // Sera remplacé par le trigger
          nom: formData.nom,
          prenom: formData.prenom,
          cin: formData.cin,
          type_contrat: formData.type_contrat,
          service: formData.service || null,
          poste: formData.poste,
          date_embauche: formData.date_embauche,
        }] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as Employee;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Employé ${data.code} créé avec succès`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...formData }: EmployeeFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          cin: formData.cin,
          type_contrat: formData.type_contrat,
          service: formData.service || null,
          poste: formData.poste,
          date_embauche: formData.date_embauche,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employé mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employé supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
