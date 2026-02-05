
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface OCRData {
    policyNumber: string | null;
    amount: number | null;
    customerName: string | null;
    plateNumber: string | null;
    identityNo: string | null;
    startDate: string | null;
    endDate: string | null;
    policyTypeKey: string | null;
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
            } else {
                setError(response.data.error || 'Poliçe verileri okunamadı.');
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Dosya yüklenirken bir hata oluştu. Lütfen dökümanın net olduğundan emin olun.');
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
                    relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer min-h-[160px] flex items-center justify-center
                    ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:border-emerald-400 hover:bg-muted/50'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    ${success ? 'border-emerald-500 bg-emerald-50' : ''}
                    ${error ? 'border-red-500 bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center gap-3">
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-extrabold text-emerald-800 animate-pulse">
                                    Belge okunuyor...
                                </p>
                                <p className="text-[10px] text-emerald-600 font-medium tracking-wider uppercase">
                                    Yapay Zeka Analizi Yapılıyor
                                </p>
                            </div>
                        </div>
                    ) : success ? (
                        <>
                            <div className="text-emerald-500 bg-emerald-100 p-3 rounded-full">
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
                        <div className="max-w-xs space-y-2">
                            <div className="text-red-500 mx-auto w-fit">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-sm font-bold text-red-700">
                                Okuma Tamamlanamadı
                            </p>
                            <p className="text-xs text-red-600 leading-relaxed">
                                {error}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={`p-4 rounded-full ${isDragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
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
