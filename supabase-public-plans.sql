-- Adaugă field-ul `is_public` la tabela `profiles`
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Oprim momentan RLS strict pe profiles pentru citirea is_public (dacă e nevoie), sau o includem în getPublicPlan bypass-ând RLS
-- Dar pentru siguranță, adăugăm o politică pe profiles care să permită oricărui utilizator să vadă is_public dacă e true:
-- Însă cel mai simplu pentru noi e să folosim Service_Role (adminClient) în Server Action pentru getPublicPlan.
