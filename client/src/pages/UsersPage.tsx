import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trash2, User, Mail, Shield, Building2, Search, MoreHorizontal, UserPlus, Fingerprint, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
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
    const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/users', {
                name,
                email,
                password,
                role,
                branchId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setName('');
            setEmail('');
            setPassword('');
            fetchUsers();
        } catch (error) {
            alert('Kullanıcı oluşturulamadı');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            alert('Kullanıcı silinemedi');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="text-[9px] font-black bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-lg uppercase tracking-widest leading-normal">System Admin</span>;
            case 'MANAGER': return <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg uppercase tracking-widest leading-normal">Manajer</span>;
            default: return <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-widest leading-normal">Personel</span>;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Sistem erişimi olan personelleri ve rollerini yönetin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Add User Form */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">Yeni Personel</h3>
                                <p className="text-xs text-gray-400 font-medium tracking-wide">Erişim yetkilendirmesi tanımlayın</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tam İsim</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className="h-12 bg-gray-50 border-none rounded-xl text-sm font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-Posta</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ahmet@zenithcrm.com"
                                        className="h-12 bg-gray-50 border-none rounded-xl pl-11 text-sm font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Geçici Şifre</label>
                                <div className="relative">
                                    <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 karakter"
                                        className="h-12 bg-gray-50 border-none rounded-xl pl-11 text-sm font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Yetki Rolü</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border-none rounded-xl px-4 outline-none text-sm font-bold text-gray-700"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="EMPLOYEE">Personel</option>
                                        <option value="MANAGER">Müdür</option>
                                        <option value="ADMIN">Super Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bağlı Şube</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border-none rounded-xl px-4 outline-none text-sm font-bold text-gray-700"
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
                            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5 mt-2">
                                Kullanıcıyı Tanımla
                            </Button>
                        </form>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-[40px] text-white relative overflow-hidden shadow-xl">
                        <Shield size={120} className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none" />
                        <h4 className="text-sm font-bold text-emerald-400 tracking-widest uppercase mb-1">Güvenlik Kontrolü</h4>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed">
                            Yeni kullanıcılar oluşturulduğunda şifrelerini ilk girişte değiştirmeleri önerilir. Sadece gerekli yetkileri atadığınızdan emin olun.
                        </p>
                    </div>
                </div>

                {/* Right: User List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="İsim veya e-posta ile ara..."
                                className="w-full pl-11 pr-4 py-2 bg-gray-50 border-none rounded-xl outline-none text-sm text-gray-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* Unified User Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Yükleniyor...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="col-span-full bg-white p-20 rounded-[40px] border border-dashed border-gray-200 text-center">
                                <User size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold">Sonuç bulunamadı.</p>
                            </div>
                        ) : filteredUsers.map((user) => (
                            <div key={user.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all font-black text-xl shadow-inner">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-gray-900 leading-tight truncate max-w-[150px]">{user.name}</h4>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
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
                                        <Building2 size={12} className="text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user.branch?.name || 'GENEL'}</span>
                                    </div>
                                    {getRoleBadge(user.role)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
