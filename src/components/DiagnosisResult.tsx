import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DiagnosisResultProps {
  disease: string;
  confidence: number;
  description: string;
  advice: string;
  timestamp?: string;
}

export const DiagnosisResult = ({ 
  disease, 
  confidence, 
  description, 
  advice,
  timestamp 
}: DiagnosisResultProps) => {
  const isHealthy = disease.toLowerCase().includes('healthy') || disease.toLowerCase().includes('sağlıklı');
  const confidenceColor = confidence >= 80 ? 'success' : confidence >= 60 ? 'warning' : 'destructive';
  
  return (
    <Card className="animate-slide-up shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-warning" />
              )}
              {disease}
            </CardTitle>
            {timestamp && (
              <CardDescription>
                {new Date(timestamp).toLocaleDateString('tr-TR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant="outline"
            className={cn(
              "ml-2",
              confidenceColor === 'success' && "border-success text-success",
              confidenceColor === 'warning' && "border-warning text-warning",
              confidenceColor === 'destructive' && "border-destructive text-destructive"
            )}
          >
            %{confidence.toFixed(1)} Güven
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-info" />
            Açıklama
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        
        {!isHealthy && (
          <div className="space-y-2 p-4 bg-accent/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle className="h-4 w-4" />
              Tedavi Önerileri
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {advice}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};