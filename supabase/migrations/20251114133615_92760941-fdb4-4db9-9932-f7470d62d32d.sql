-- Bitki teşhis kayıtları için tablo oluştur
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  disease TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  description TEXT NOT NULL,
  advice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS politikalarını etkinleştir
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi kayıtlarını görebilir
CREATE POLICY "Users can view own diagnoses"
  ON public.diagnoses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi kayıtlarını oluşturabilir
CREATE POLICY "Users can create own diagnoses"
  ON public.diagnoses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi kayıtlarını silebilir
CREATE POLICY "Users can delete own diagnoses"
  ON public.diagnoses
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indeks oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON public.diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON public.diagnoses(created_at DESC);