-- Filament — Fase 2: policy Storage per il bucket `documents`
-- Eseguire manualmente in Supabase → SQL Editor.
-- Il path dei file è: {user_id}/{uuid}-{file_name}, quindi la prima cartella
-- del path coincide con l'id del cliente.

-- Il cliente può uploadare solo nella propria cartella
CREATE POLICY "storage: insert own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Il cliente può leggere solo i propri file
CREATE POLICY "storage: select own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
