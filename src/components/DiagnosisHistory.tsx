import { History, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiagnosisResult } from './DiagnosisResult';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Diagnosis {
  id: string;
  disease: string;
  confidence: number;
  description: string;
  advice: string;
  timestamp: string;
}

interface DiagnosisHistoryProps {
  diagnoses: Diagnosis[];
  isLoading?: boolean;
}

export const DiagnosisHistory = ({ diagnoses, isLoading }: DiagnosisHistoryProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Henüz teşhis kaydınız bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Teşhis Geçmişi
        </CardTitle>
        <CardDescription>
          Toplam {diagnoses.length} teşhis kaydı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {diagnoses.map((diagnosis) => (
              <DiagnosisResult
                key={diagnosis.id}
                disease={diagnosis.disease}
                confidence={diagnosis.confidence}
                description={diagnosis.description}
                advice={diagnosis.advice}
                timestamp={diagnosis.timestamp}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};