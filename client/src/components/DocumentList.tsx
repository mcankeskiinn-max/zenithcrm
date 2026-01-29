import { useEffect, useState } from 'react';
import { FileText, Trash2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface Document {
    id: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    uploadedAt: string;
}

interface DocumentListProps {
    saleId: string;
    refreshTrigger?: number; // Prop to trigger refresh
}

export function DocumentList({ saleId, refreshTrigger }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, [saleId, refreshTrigger]);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/documents/${saleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(res.data);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) return;

        setDeletingId(id);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/documents/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(docs => docs.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to delete document', error);
            alert('Belge silinemedi');
        } finally {
            setDeletingId(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return <div className="py-4 text-center text-sm text-muted-foreground font-medium">Belgeler yükleniyor...</div>;
    }

    if (documents.length === 0) {
        return <div className="py-4 text-center text-sm text-muted-foreground italic">Henüz belge yüklenmemiş.</div>;
    }

    return (
        <div className="space-y-3 mt-4">
            {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border group hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-emerald-600 shadow-sm">
                            <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" title={doc.filename}>{doc.filename}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                            onClick={() => window.open(`http://localhost:3000/uploads/${doc.path}`, '_blank')}
                            title="Görüntüle"
                        >
                            <Eye size={16} />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            title="Sil"
                        >
                            {deletingId === doc.id ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
