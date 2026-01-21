import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/hooks/useCompany';
import { Loader2, Upload, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { company, isLoading, saveCompany, uploadLogo } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    ville: '',
    logo_url: '',
    cnss_employeur: '',
    rib: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        nom: company.nom || '',
        adresse: company.adresse || '',
        ville: company.ville || '',
        logo_url: company.logo_url || '',
        cnss_employeur: company.cnss_employeur || '',
        rib: company.rib || '',
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast.error('Le nom de la société est obligatoire');
      return;
    }
    
    await saveCompany.mutateAsync(formData);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 Mo');
      return;
    }
    
    setIsUploading(true);
    try {
      const url = await uploadLogo(file);
      setFormData({ ...formData, logo_url: url });
      toast.success('Logo téléchargé avec succès');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = saveCompany.isPending;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Paramètres de la Société"
        description="Configurez les informations de votre entreprise pour les bulletins de paie"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informations de l'entreprise
          </CardTitle>
          <CardDescription>
            Ces informations seront affichées sur les bulletins de paie générés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo de l'entreprise</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer le logo
                      </>
                    )}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG ou WEBP. Max 2 Mo.
                  </p>
                </div>
              </div>
            </div>

            {/* Nom de la société */}
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la société *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ma Société SARL"
                required
              />
            </div>

            {/* Adresse et Ville */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="123 Rue Exemple"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Casablanca"
                />
              </div>
            </div>

            {/* CNSS et RIB */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnss_employeur">N° CNSS Employeur</Label>
                <Input
                  id="cnss_employeur"
                  value={formData.cnss_employeur}
                  onChange={(e) => setFormData({ ...formData, cnss_employeur: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rib">RIB Bancaire</Label>
                <Input
                  id="rib"
                  value={formData.rib}
                  onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                  placeholder="XXXX XXXX XXXX XXXX"
                />
              </div>
            </div>

            {/* Bouton de sauvegarde */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="shadow-primary">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
