import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Company, CompanyFormData } from '@/types/database';
import { toast } from 'sonner';

export function useCompany() {
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Company | null;
    },
  });

  const saveCompany = useMutation({
    mutationFn: async (formData: CompanyFormData) => {
      // Vérifier s'il existe déjà une entrée
      const { data: existing } = await supabase
        .from('company')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        // Mise à jour
        const { data, error } = await supabase
          .from('company')
          .update({
            nom: formData.nom,
            adresse: formData.adresse || null,
            ville: formData.ville || null,
            logo_url: formData.logo_url || null,
            cnss_employeur: formData.cnss_employeur || null,
            rib: formData.rib || null,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data as Company;
      } else {
        // Création
        const { data, error } = await supabase
          .from('company')
          .insert([{
            nom: formData.nom,
            adresse: formData.adresse || null,
            ville: formData.ville || null,
            logo_url: formData.logo_url || null,
            cnss_employeur: formData.cnss_employeur || null,
            rib: formData.rib || null,
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data as Company;
      }
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
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);
    
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
