-- Filament — Fase 1: schema dati
-- Eseguire manualmente in Supabase → SQL Editor.
-- Il bucket Storage (punto in fondo) si crea dalla Dashboard, non da qui.

-- 1. PROFILES
-- Estende auth.users con dati dello studio/perito
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  studio_name TEXT NOT NULL,
  email TEXT NOT NULL,
  public_key TEXT NOT NULL,         -- chiave pubblica RSA/ed25519 del cliente
  encrypted_private_key TEXT NOT NULL, -- chiave privata cifrata (AES-256, derivata da password)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Il cliente può leggere e aggiornare solo il proprio profilo
CREATE POLICY "profiles: select own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. DOCUMENTS (hash-chain per cliente)
-- Tabella append-only: ogni record è un blocco della catena del cliente
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,          -- SHA-256 del file originale
  previous_hash TEXT,               -- hash del record precedente (NULL per il primo blocco)
  block_hash TEXT NOT NULL,         -- SHA-256(file_hash + previous_hash + timestamp)
  signature TEXT NOT NULL,          -- firma digitale del block_hash con chiave privata cliente
  ai_summary JSONB,                 -- output resoconto IA (nullable, popolato async)
  ai_summary_at TIMESTAMPTZ,        -- quando è stato generato il resoconto
  storage_path TEXT NOT NULL,       -- path in Supabase Storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- APPEND-ONLY: solo INSERT, mai UPDATE o DELETE
-- Il cliente può inserire solo documenti propri
CREATE POLICY "documents: insert own" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Il cliente può leggere solo i propri documenti
CREATE POLICY "documents: select own" ON public.documents
  FOR SELECT USING (auth.uid() = profile_id);

-- Lettura pubblica per certificati (chiunque con l'id può verificare)
CREATE POLICY "documents: select public" ON public.documents
  FOR SELECT USING (true);

-- NESSUNA policy UPDATE o DELETE — append-only garantito a livello DB

-- 3. MERKLE_ROOTS (append-only, una root al giorno)
CREATE TABLE public.merkle_roots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_hash TEXT NOT NULL,          -- root del Merkle tree giornaliero
  tip_hashes JSONB NOT NULL,        -- {profile_id: block_hash} di ogni cliente attivo quel giorno
  profiles_count INTEGER NOT NULL,  -- numero di clienti inclusi
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.merkle_roots ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica (pagina trasparenza)
CREATE POLICY "merkle_roots: select public" ON public.merkle_roots
  FOR SELECT USING (true);

-- Solo service role può inserire (job notturno schedulato)
-- Nessuna policy INSERT per anon/authenticated → solo il backend privilegiato può scrivere

-- 4. STORAGE BUCKET per i file
-- Esegui separatamente in Supabase Dashboard → Storage → New bucket
-- Nome: documents
-- Public: NO (privato)
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp
