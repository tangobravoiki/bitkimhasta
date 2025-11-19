-- Add missing UPDATE policy for diagnoses table
CREATE POLICY "Users can update own diagnoses"
ON public.diagnoses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);