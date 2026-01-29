import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface FileUploadProps {
    saleId: string;
    onUploadComplete?: () => void;
}

export function FileUpload({ saleId, onUploadComplete }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);

    const validateFile = (selectedFile: File): boolean => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Sadece PDF, JPG ve PNG formatları desteklenmektedir.');
            return false;
        }

        if (selectedFile.size > maxSize) {
            setError('Dosya boyutu 5 MB\'dan küçük olmalıdır.');
            return false;
        }

        setError(null);
        return true;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                setFile(droppedFile);
                setUploadStatus('idle');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                setUploadStatus('idle');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('saleId', saleId);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            setUploadStatus('success');
            setFile(null);
            if (onUploadComplete) onUploadComplete();

            // Reset success message after 3 seconds
            setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 transition-all text-center",
                    isDragging
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-500/30 hover:bg-muted",
                    uploadStatus === 'error' && "border-red-500/20 bg-red-500/10"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                />

                <div className="flex flex-col items-center gap-3">
                    {uploadStatus === 'success' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <p className="text-sm font-medium text-emerald-500">Dosya başarıyla yüklendi!</p>
                        </>
                    ) : file ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                                <FileText className="w-6 h-6 text-emerald-500" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="absolute -top-1 -right-1 bg-card rounded-full border border-border shadow-sm p-0.5 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    'Dosyayı Sunucuya Kaydet'
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    Dosyayı buraya sürükleyin
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    veya seçmek için <button onClick={() => fileInputRef.current?.click()} className="text-emerald-500 hover:underline">tıklayın</button>
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                PDF, JPG, PNG (Max 5MB)
                            </p>
                        </>
                    )}
                </div>
            </div>

            {(uploadStatus === 'error' || error) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {error || 'Yükleme başarısız oldu. Lütfen tekrar deneyin.'}
                </div>
            )}
        </div>
    );
}
