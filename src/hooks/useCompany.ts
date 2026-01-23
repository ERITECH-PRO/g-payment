import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Company, CompanyFormData } from '@/types/database';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';

export function useCompany() {
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/company`);
      if (!response.ok) {
        // If error is 500 etc, maybe return null if no company found logic on backend isn't 404
        // But here assumption is backend returns null or object
        return null;
      }
      const data = await response.json();
      return data as Company | null;
    },
  });

  const saveCompany = useMutation({
    mutationFn: async (formData: CompanyFormData) => {
      const response = await fetch(`${API_URL}/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save company settings');
      }
      return response.json() as Promise<Company>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Paramètres enregistrés avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    const data = await response.json();
    return data.publicUrl;
  };

  return {
    company,
    isLoading,
    error,
    saveCompany,
    uploadLogo,
  };
}
