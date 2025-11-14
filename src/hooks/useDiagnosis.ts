import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosisResult {
  disease: string;
  confidence: number;
  description: string;
  advice: string;
}

export const useDiagnosis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const diagnose = async (file: File): Promise<DiagnosisResult | null> => {
    setIsAnalyzing(true);

    try {
      // 1. Kullanıcı oturum kontrolü
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: 'Oturum gerekli',
          description: 'Bitki teşhisi yapmak için giriş yapmanız gerekiyor',
          variant: 'destructive',
        });
        return null;
      }

      // 2. Görüntüyü storage'a yükle
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Yükleme hatası',
          description: 'Görüntü yüklenemedi. Lütfen tekrar deneyin.',
          variant: 'destructive',
        });
        return null;
      }

      // 3. Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName);

      // 4. Edge function'ı çağır (AI analizi)
      const { data: diagnosisData, error: functionError } = await supabase.functions.invoke(
        'diagnose-plant',
        {
          body: { imageUrl: publicUrl },
        }
      );

      if (functionError) {
        console.error('Function error:', functionError);
        toast({
          title: 'Analiz hatası',
          description: 'Bitki analizi yapılamadı. Lütfen tekrar deneyin.',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Analiz tamamlandı',
        description: 'Bitki teşhisi başarıyla yapıldı',
      });

      return diagnosisData as DiagnosisResult;
    } catch (error) {
      console.error('Diagnosis error:', error);
      toast({
        title: 'Beklenmeyen hata',
        description: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { diagnose, isAnalyzing };
};