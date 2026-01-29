import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Check,
    CheckCheck,
    ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
    id: string;
    name: string;
    role: string;
    lastMessage: string;
    lastMessageAt: string | null;
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    isRead: boolean;
    createdAt: string;
}

export default function MessagingPage() {
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        fetchConversations();
    }, []);

    // Role translations for search
    const roleTranslations: Record<string, string> = {
        'ADMIN': 'admin yönetici superadmin',
        'MANAGER': 'müdür yönetici manager',
        'EMPLOYEE': 'personel çalışan employee'
    };

    // Handle direct user selection from URL
    useEffect(() => {
        const userId = searchParams.get('userId');

        const handleDirectSelection = async () => {
            if (!userId) return;

            // First check if already in conversations
            let userToSelect = conversations.find(c => c.id === userId);

            if (userToSelect) {
                if (!selectedUser || selectedUser.id !== userToSelect.id) {
                    setSelectedUser(userToSelect);
                }
            }
        };

        handleDirectSelection();
    }, [searchParams, conversations]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            const interval = setInterval(() => fetchMessages(selectedUser.id), 5000); // Polling
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/messages/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
        } catch (error) {
            // Silent
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/messages/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            // Silent
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/messages', {
                receiverId: selectedUser.id,
                content: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages([...messages, res.data]);
            setNewMessage('');
            fetchConversations();
        } catch (error: any) {
            alert('Mesaj gönderilemedi: ' + (error.response?.data?.error || 'Sunucu hatası'));
        }
    };

    const filteredConversations = conversations.filter(c => {
        const query = searchQuery.toLowerCase();
        const nameMatch = c.name.toLowerCase().includes(query);
        const roleData = roleTranslations[c.role] || '';
        const roleMatch = roleData.toLowerCase().includes(query);
        return nameMatch || roleMatch;
    });

    return (
        <div className="flex h-[calc(100vh-120px)] bg-card rounded-[32px] overflow-hidden shadow-2xl border border-border">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-extrabold text-foreground mb-4">Mesajlar</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            placeholder="İsim veya rol ile ara..."
                            className="w-full bg-muted border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedUser(conv)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-muted border-l-4 ${selectedUser?.id === conv.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent'}`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                                    {conv.name.charAt(0)}
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-foreground truncate">{conv.name}</p>
                                    {conv.lastMessageAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(conv.lastMessageAt), 'HH:mm')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || conv.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col bg-background ${!selectedUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="md:hidden p-2 hover:bg-muted rounded-xl transition-all"
                                >
                                    <ArrowLeft size={20} className="text-muted-foreground" />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground leading-tight">{selectedUser.name}</p>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{selectedUser.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                                    <Phone size={18} />
                                </button>
                                <button className="p-2.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                                    <Video size={18} />
                                </button>
                                <button className="p-2.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === currentUser?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] group ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-4 rounded-[20px] ${isMe ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-500/20' : 'bg-card text-foreground rounded-tl-none border border-border shadow-sm'}`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 px-1">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                                {isMe && (
                                                    msg.isRead ? <CheckCheck size={12} className="text-emerald-500" /> : <Check size={12} className="text-muted-foreground/30" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-card border-t border-border rounded-b-[32px]">
                            <form onSubmit={handleSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Bir mesaj yazın..."
                                    className="flex-1 bg-muted border-none rounded-2xl px-6 py-3.5 text-sm focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-foreground"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    <Send size={20} className="ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-8">
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Send size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-foreground mb-2">Hemen İletişime Geçin</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            Personel ve yöneticilerinizle hızlı ve güvenli mesajlaşın. Bir konuşma seçerek başlayın.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
