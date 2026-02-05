import { useEffect, useState } from 'react';
import axios from 'axios';

export interface SessionInfo {
    id: string;
    tokenSuffix: string;
    createdAt: string;
    expiresAt: string;
    userId: string;
}

export const SessionPanel = () => {
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/sessions');
            setSessions(res.data.sessions || []);
        } finally {
            setLoading(false);
        }
    };

    const revokeAll = async () => {
        await axios.post('/api/sessions/logout-all', {});
        fetchSessions();
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return (
        <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Oturum Yönetimi</h3>
                    <p className="text-sm text-muted-foreground">Aktif oturumlarý görüntüleyin ve gerekirse sýfýrlayýn.</p>
                </div>
                <button
                    onClick={revokeAll}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                >
                    Tüm Oturumlarý Kapat
                </button>
            </div>

            {loading ? (
                <div className="text-sm text-muted-foreground">Yükleniyor...</div>
            ) : sessions.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aktif oturum bulunamadý.</div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((s) => (
                        <div key={s.id} className="p-4 rounded-2xl border border-border bg-muted/40">
                            <div className="text-xs text-muted-foreground">Token: {s.tokenSuffix}...</div>
                            <div className="text-xs text-muted-foreground">Oluþturma: {new Date(s.createdAt).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Bitiþ: {new Date(s.expiresAt).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

