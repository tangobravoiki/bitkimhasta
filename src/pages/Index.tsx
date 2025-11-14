import { useState } from 'react';
import { Leaf, Sparkles } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { DiagnosisResult } from '@/components/DiagnosisResult';
import { DiagnosisHistory } from '@/components/DiagnosisHistory';
import { Button } from '@/components/ui/button';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { useDiagnosisHistory } from '@/hooks/useDiagnosisHistory';

interface DiagnosisData {
  disease: string;
  confidence: number;
  description: string;
  advice: string;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisData | null>(null);
  const { diagnose, isAnalyzing } = useDiagnosis();
  const { diagnoses, isLoading: isLoadingHistory } = useDiagnosisHistory();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentDiagnosis(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    const result = await diagnose(selectedFile);
    if (result) {
      setCurrentDiagnosis(result);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Destekli Bitki Teşhisi</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Bitkilerinizin Sağlığını
            <span className="text-primary block mt-2">Anında Öğrenin</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Yapay zeka teknolojisi ile bitki fotoğrafınızı yükleyin, 
            hastalıkları tespit edin ve profesyonel tedavi önerileri alın
          </p>
        </div>
      </section>

      {/* Upload & Analysis Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Leaf className="h-5 w-5 text-primary" />
                Bitki Fotoğrafı Yükle
              </div>
              <FileUpload 
                onFileSelect={handleFileSelect}
                isAnalyzing={isAnalyzing}
              />
              <Button 
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                size="lg"
              >
                {isAnalyzing ? "Analiz Ediliyor..." : "Teşhis Et"}
              </Button>
            </div>

            {/* Results Area */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-primary" />
                Teşhis Sonucu
              </div>
              {currentDiagnosis ? (
                <DiagnosisResult {...currentDiagnosis} />
              ) : (
                <div className="h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Leaf className="h-12 w-12 mx-auto opacity-20" />
                    <p className="text-sm">Teşhis sonuçları burada görünecek</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <DiagnosisHistory 
            diagnoses={diagnoses}
            isLoading={isLoadingHistory}
          />
        </div>
      </section>
    </div>
  );
};

export default Index;