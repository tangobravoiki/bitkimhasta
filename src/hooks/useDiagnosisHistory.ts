import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Diagnosis {
  id: string;
  disease: string;
  confidence: number;
  description: string;
  advice: string;
  timestamp: string;
}

export const useDiagnosisHistory = () => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setDiagnoses([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('diagnoses')
        .select('id, disease, confidence, description, advice, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Fetch history error:', error);
        toast({
          title: 'Geçmiş yüklenemedi',
          description: 'Teşhis geçmişi yüklenirken hata oluştu',
          variant: 'destructive',
        });
        return;
      }

      const formattedData = data.map((item: any) => ({
        id: item.id,
        disease: item.disease,
        confidence: item.confidence,
        description: item.description,
        advice: item.advice,
        timestamp: item.created_at,
      }));

      setDiagnoses(formattedData);
    } catch (error) {
      console.error('History error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Realtime subscription
    const channel = supabase
      .channel('diagnoses-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'diagnoses',
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { diagnoses, isLoading, refetch: fetchHistory };
};