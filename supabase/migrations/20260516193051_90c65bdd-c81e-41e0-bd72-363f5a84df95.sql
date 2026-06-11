-- Create a new storage bucket for user documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy to allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents (assuming 'admin' role in profiles)
CREATE POLICY "Admins can view all user documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
