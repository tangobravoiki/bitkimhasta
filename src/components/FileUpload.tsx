import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

export const FileUpload = ({ onFileSelect, isAnalyzing, disabled }: FileUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <label
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            isDragging 
              ? "border-primary bg-accent/50 scale-[1.02]" 
              : "border-border bg-card hover:bg-accent/30 hover:border-primary",
            (disabled || isAnalyzing) && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isAnalyzing) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            <Upload className={cn(
              "w-12 h-12 mb-4 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="mb-2 text-sm font-medium">
              <span className="text-primary">Tıklayın</span> veya fotoğrafı sürükleyin
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG veya WEBP (Maks. 5MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled || isAnalyzing}
          />
        </label>
      ) : (
        <div className="relative w-full">
          <div className="relative rounded-lg overflow-hidden shadow-card">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-64 object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  <p className="text-sm font-medium">Bitki analiz ediliyor...</p>
                </div>
              </div>
            )}
          </div>
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 rounded-full shadow-lg"
              onClick={clearPreview}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};