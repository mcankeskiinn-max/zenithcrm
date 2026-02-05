import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trash2, User, Mail, Shield, Building2, Search, MoreHorizontal, UserPlus, Fingerprint, MessageSquare, Edit2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    branchId?: string;
    branch?: { name: string };
}

export default function UsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [branchId, setBranchId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);

    const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
const res = await axios.get('/api/branches', {
                
            });
            setBranches(res.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const fetchUsers = async () => {
        try {
const res = await axios.get('/api/users', {
                
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user.id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setBranchId(user.branchId || '');
        setIsActive(user.isActive);
        setPassword(''); // Don't show password, only update if provided
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setName('');
        setEmail('');
        setRole('EMPLOYEE');
        setBranchId('');
        setIsActive(true);
        setPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
if (editingUser) {
                await axios.put(`/api/users/${editingUser}`, {
                    name,
                    role,
                    branchId,
                    isActive,
                    ...(password ? { password } : {})
                }, {
                    
                });
            } else {
                await axios.post('/api/users', {
                    name,
                    email,
                    password,
                    role,
                    branchId
                }, {
                    
                });
            }
            cancelEdit();
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
        try {
await axios.delete(`/api/users/${id}`, {
                
            });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Kullanıcı silinemedi');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="text-[9px] font-black bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-lg uppercase tracking-widest leading-normal">System Admin</span>;
            case 'MANAGER': return <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg uppercase tracking-widest leading-normal">Menajer</span>;
            default: return <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-widest leading-normal">Personel</span>;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Sistem erişimi olan personelleri ve rollerini yönetin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Add/Edit User Form */}
                <div className="space-y-6">
                    <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl ${editingUser ? 'bg-orange-500' : 'bg-emerald-600'} flex items-center justify-center text-white shadow-lg ${editingUser ? 'shadow-orange-200' : 'shadow-emerald-200'}`}>
                                    {editingUser ? <Edit2 size={24} /> : <UserPlus size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground leading-tight">{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Personel'}</h3>
                                    <p className="text-xs text-muted-foreground font-medium tracking-wide">Erişim yetkilendirmesi tanımlayın</p>
                                </div>
                            </div>
                            {editingUser && (
                                <button onClick={cancelEdit} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tam İsim</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className="h-12 bg-muted border-none rounded-xl text-sm font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">E-Posta</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ahmet@zenithcrm.com"
                                        className={`h-12 bg-muted border-none rounded-xl pl-11 text-sm font-bold ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        required
                                        disabled={!!editingUser}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{editingUser ? 'Yeni Şifre (Opsiyonel)' : 'Geçici Şifre'}</label>
                                <div className="relative">
                                    <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={editingUser ? "Değiştirmek istemiyorsanız boş bırakın" : "Min. 6 karakter"}
                                        className="h-12 bg-muted border-none rounded-xl pl-11 text-sm font-bold"
                                        required={!editingUser}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Yetki Rolü</label>
                                    <select
                                        className="w-full h-12 bg-muted border-none rounded-xl px-4 outline-none text-sm font-bold text-gray-700"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="EMPLOYEE">Personel</option>
                                        <option value="MANAGER">Müdür</option>
                                        <option value="ADMIN">Super Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Bağlı Şube</label>
                                    <select
                                        className="w-full h-12 bg-muted border-none rounded-xl px-4 outline-none text-sm font-bold text-gray-700"
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {editingUser && (
                                <div className="pt-2">
                                    <div
                                        onClick={() => setIsActive(!isActive)}
                                        className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className={`w-10 h-6 rounded-full relative transition-colors ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-5' : 'left-1'}`} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{isActive ? 'Hesap Aktif' : 'Hesap Pasif'}</span>
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className={`w-full h-12 ${editingUser ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'} text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 mt-2`}>
                                {editingUser ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Tanımla'}
                            </Button>
                        </form>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-[40px] text-white relative overflow-hidden shadow-xl">
                        <Shield size={120} className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none" />
                        <h4 className="text-sm font-bold text-emerald-400 tracking-widest uppercase mb-1">Güvenlik Kontrolü</h4>
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                            Yeni kullanıcılar oluşturulduğunda şifrelerini ilk girişte değiştirmeleri önerilir. Sadece gerekli yetkileri atadığınızdan emin olun.
                        </p>
                    </div>
                </div>

                {/* Right: User List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Bar */}
                    <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex items-center gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="İsim veya e-posta ile ara..."
                                className="w-full pl-11 pr-4 py-2 bg-muted border-none rounded-xl outline-none text-sm text-gray-700 focus:bg-card focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2.5 bg-muted text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* Unified User Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest">Yükleniyor...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="col-span-full bg-card p-20 rounded-[40px] border border-dashed border-gray-200 text-center">
                                <User size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-muted-foreground font-bold">Sonuç bulunamadı.</p>
                            </div>
                        ) : filteredUsers.map((user) => (
                            <div key={user.id} className={`bg-card p-6 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${!user.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground ${user.isActive ? 'group-hover:bg-emerald-600 group-hover:text-white' : ''} transition-all font-black text-xl shadow-inner`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-foreground leading-tight truncate max-w-[150px]">{user.name}</h4>
                                                {!user.isActive && <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase">PASİF</span>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                <Mail size={12} />
                                                <span className="truncate max-w-[150px]">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => navigate(`/messaging?userId=${user.id}`)}
                                            className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            title="Mesaj Gönder"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className={`p-2 transition-all rounded-xl ${editingUser === user.id ? 'text-orange-600 bg-orange-50' : 'text-gray-300 hover:text-orange-600 hover:bg-orange-50'}`}
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-5 relative z-10">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={12} className="text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.branch?.name || 'GENEL'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.isActive ? <CheckCircle2 size={12} className="text-emerald-500" /> : <AlertCircle size={12} className="text-red-500" />}
                                        {getRoleBadge(user.role)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


