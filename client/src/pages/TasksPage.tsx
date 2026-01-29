import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Check, Trash2, Clock, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    isCompleted: boolean;
    assignedTo?: { name: string };
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/tasks', { title, description, dueDate }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTitle('');
            setDescription('');
            setDueDate('');
            fetchTasks();
        } catch (error) {
            alert('Görev oluşturulamadı');
        }
    };

    const toggleComplete = async (task: Task) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/tasks/${task.id}`, { isCompleted: !task.isCompleted }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (error) {
            alert('Görev güncellenemedi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Emin misiniz?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (error) {
            alert('Görev silinemedi');
        }
    };

    const getOverdueStatus = (dateStr: string, isCompleted: boolean) => {
        if (isCompleted) return 'completed';
        const now = new Date();
        const due = new Date(dateStr);
        return due < now ? 'overdue' : 'pending';
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Görev & Ajanda</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Yapılacak işler ve randevularınızı takip edin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Stats & Form */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Add Task Form */}
                    <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Plus size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Hızlı Ekle</h3>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Konu</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Poliçe yenileme araması"
                                    className="h-11 bg-muted border-none rounded-xl text-sm font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Detaylar</label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Açıklama giriniz..."
                                    className="h-11 bg-muted border-none rounded-xl text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Zaman</label>
                                <Input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="h-11 bg-muted border-none rounded-xl text-sm font-bold"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all mt-2">
                                Kaydet
                            </Button>
                        </form>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-900 p-6 rounded-[32px] text-white space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tamamlanan</span>
                            <span className="text-xl font-black text-emerald-400">{tasks.filter(t => t.isCompleted).length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Bekleyen</span>
                            <span className="text-xl font-black text-blue-400">{tasks.filter(t => !t.isCompleted).length}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Task Cards */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest">Yükleniyor...</div>
                        ) : tasks.length === 0 ? (
                            <div className="col-span-full bg-card p-20 rounded-[40px] border border-dashed border-border text-center">
                                <Calendar size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
                                <p className="text-muted-foreground font-bold uppercase tracking-widest">Planlanmış bir görev yok</p>
                            </div>
                        ) : tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => {
                            const status = getOverdueStatus(task.dueDate, task.isCompleted);

                            return (
                                <div key={task.id} className={`bg-card p-6 rounded-[32px] border transition-all group relative overflow-hidden ${task.isCompleted ? 'opacity-60 bg-muted/50 border-border' : 'border-border shadow-sm hover:shadow-md'}`}>
                                    {/* Top row */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleComplete(task)}
                                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${task.isCompleted ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 border border-border'}`}
                                            >
                                                {task.isCompleted ? <Check size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                            </button>
                                            <div className="flex flex-col">
                                                <h4 className={`font-bold text-foreground leading-tight ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {status === 'overdue' && !task.isCompleted && (
                                                        <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 uppercase tracking-wider">Gecikmiş</span>
                                                    )}
                                                    <span className={`text-[10px] font-bold ${task.isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/80'}`}>{task.description || 'Açıklama yok'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-2 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Details */}
                                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border">
                                                <Clock size={12} className={status === 'overdue' && !task.isCompleted ? 'text-red-500' : 'text-emerald-600'} />
                                                <span className={`text-[11px] font-bold ${status === 'overdue' && !task.isCompleted ? 'text-red-600' : 'text-muted-foreground'}`}>
                                                    {new Date(task.dueDate).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {userRole !== 'EMPLOYEE' && task.assignedTo && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                                <User size={12} className="text-blue-500" />
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{task.assignedTo.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Corner Decoration */}
                                    <div className={`absolute top-0 right-0 w-16 h-1 bg-gradient-to-l ${status === 'overdue' && !task.isCompleted ? 'from-red-500' : task.isCompleted ? 'from-emerald-500' : 'from-blue-500'}`}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
