-- Enum pour les types de contrat
CREATE TYPE public.contract_type AS ENUM ('CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM');

-- Enum pour les rôles utilisateur
CREATE TYPE public.app_role AS ENUM ('admin');

-- Table des rôles utilisateurs
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Table compteur pour les codes employés
CREATE TABLE public.counter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity TEXT NOT NULL UNIQUE,
    last_value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer le compteur initial pour les employés
INSERT INTO public.counter (entity, last_value) VALUES ('EMP', 0);

-- Table des paramètres société
CREATE TABLE public.company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    adresse TEXT,
    ville TEXT,
    logo_url TEXT,
    cnss_employeur TEXT,
    rib TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des employés
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    cin TEXT NOT NULL UNIQUE,
    type_contrat contract_type NOT NULL DEFAULT 'CDI',
    service TEXT,
    poste TEXT NOT NULL,
    date_embauche DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des salaires
CREATE TABLE public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    salaire DECIMAL(10,2) NOT NULL CHECK (salaire >= 0),
    prime DECIMAL(10,2) DEFAULT 0 CHECK (prime >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (employee_id, year, month)
);

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Fonction pour générer le code employé automatiquement
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code INTEGER;
BEGIN
    -- Incrémenter et récupérer la nouvelle valeur
    UPDATE public.counter
    SET last_value = last_value + 1, updated_at = now()
    WHERE entity = 'EMP'
    RETURNING last_value INTO new_code;
    
    -- Générer le code formaté
    NEW.code := 'EMP-' || LPAD(new_code::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$;

-- Trigger pour générer le code employé avant l'insertion
CREATE TRIGGER trigger_generate_employee_code
    BEFORE INSERT ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_employee_code();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers pour updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salaries_updated_at
    BEFORE UPDATE ON public.salaries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_updated_at
    BEFORE UPDATE ON public.company
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counter_updated_at
    BEFORE UPDATE ON public.counter
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS sur toutes les tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

-- RLS pour user_roles (lecture seule pour les utilisateurs connectés)
CREATE POLICY "Users can read their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- RLS pour counter (admin seulement)
CREATE POLICY "Admins can manage counter"
    ON public.counter
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS pour company (admin seulement)
CREATE POLICY "Admins can manage company"
    ON public.company
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS pour employees (admin seulement)
CREATE POLICY "Admins can manage employees"
    ON public.employees
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS pour salaries (admin seulement)
CREATE POLICY "Admins can manage salaries"
    ON public.salaries
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Créer un bucket de stockage pour les logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Politique pour permettre aux admins d'uploader des logos
CREATE POLICY "Admins can upload logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'logos' AND public.is_admin());

CREATE POLICY "Anyone can view logos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'logos');

CREATE POLICY "Admins can update logos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'logos' AND public.is_admin());

CREATE POLICY "Admins can delete logos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'logos' AND public.is_admin());