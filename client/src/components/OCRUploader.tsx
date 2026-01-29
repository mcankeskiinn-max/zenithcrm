
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface OCRData {
    policyNumber: string | null;
    amount: number | null;
    customerName: string | null;
    plateNumber: string | null;
}

interface OCRUploaderProps {
    onScanComplete: (data: OCRData) => void;
}

export const OCRUploader: React.FC<OCRUploaderProps> = ({ onScanComplete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.append('document', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/ocr/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setSuccess(true);
                onScanComplete(response.data.data);
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Dosya yüklenirken bir hata oluştu');
        } finally {
            setIsUploading(false);
        }
    }, [onScanComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        disabled: isUploading
    });

    return (
        <div className="mb-6">
            <div
                {...getRootProps()}
                className={`
                    relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer
                    ${isDragActive ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-amber-400 hover:bg-muted/50'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    ${success ? 'border-emerald-500 bg-emerald-50' : ''}
                    ${error ? 'border-red-500 bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center gap-3">
                    {isUploading ? (
                        <>
                            <div className="animate-spin text-amber-500">
                                <Loader2 size={32} />
                            </div>
                            <p className="text-sm font-medium text-amber-600 animate-pulse">
                                Poliçe taranıyor ve analiz ediliyor...
                            </p>
                        </>
                    ) : success ? (
                        <>
                            <div className="text-emerald-500">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="text-sm font-bold text-emerald-700">
                                Analiz Başarılı!
                            </p>
                            <p className="text-xs text-emerald-600">
                                Veriler forma aktarıldı.
                            </p>
                        </>
                    ) : error ? (
                        <>
                            <div className="text-red-500">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-sm font-bold text-red-700">
                                Hata Oluştu
                            </p>
                            <p className="text-xs text-red-600">
                                {error}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className={`p-4 rounded-full ${isDragActive ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                {isDragActive ? <FileText size={24} /> : <Upload size={24} />}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">
                                    {isDragActive ? 'Dosyayı Buraya Bırakın' : 'Otomatik Doldurma için Poliçe Yükleyin'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PDF, JPG veya PNG (Max 5MB)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
