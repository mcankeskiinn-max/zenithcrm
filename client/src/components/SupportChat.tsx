import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, X, AlertCircle } from 'lucide-react';

interface Message {
    id: string;
    message: string;
    response: string | null;
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'FAILED';
    createdAt: string;
}

export const SupportChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const user = localStorage.getItem('user');
            if (!user) {
                setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
                return;
            }
            const response = await axios.get('/api/support/messages');
            setMessages(response.data);
        } catch (err) {
            console.error('Failed to fetch support messages:', err);
            setError('Geçmiş mesajlar yüklenemedi.');
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input;
        setInput('');
        setLoading(true);

        try {
            const user = localStorage.getItem('user');
            if (!user) {
                setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
                setLoading(false);
                return;
            }
            const response = await axios.post('/api/support/message', { message: userMessage });
            setMessages(prev => [...prev, response.data]);

            // Poll for AI response if not immediately resolved
            if (response.data.status !== 'RESOLVED') {
                pollForResponse(response.data.id);
            }
        } catch (err) {
            console.error('Failed to send support message:', err);
            setError('Mesaj gönderilemedi.');
            setLoading(false);
        }
    };

    const pollForResponse = async (id: string) => {
        const pollInterval = setInterval(async () => {
            try {
            const user = localStorage.getItem('user');
            if (!user) {
                setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
                clearInterval(pollInterval);
                setLoading(false);
                return;
            }
            const response = await axios.get(`/api/support/message/${id}`);
                if (response.data.status === 'RESOLVED' || response.data.status === 'FAILED') {
                    setMessages(prev =>
                        prev.map(msg => msg.id === id ? response.data : msg)
                    );
                    clearInterval(pollInterval);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Polling failed:', err);
                clearInterval(pollInterval);
                setLoading(false);
            }
        }, 2000);

        // Max poll for 30 seconds
        setTimeout(() => {
            clearInterval(pollInterval);
            setLoading(false);
        }, 30000);
    };

    return (
        <div className="flex flex-col h-[500px] w-[350px] bg-white dark:bg-emerald-950 rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 dark:border-emerald-800 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">AI Destek Asistanı</h3>
                        <p className="text-[10px] opacity-80">Genellikle anında yanıt verir</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/30 dark:bg-emerald-950/50">
                {messages.length === 0 && !loading && !error && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Selam! Size nasıl yardımcı olabilirim?</p>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mt-1">Teknik sorunları veya kullanım sorularınızı yazabilirsiniz.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className="space-y-3">
                        {/* User Message */}
                        <div className="flex justify-end">
                            <div className="max-w-[80%] bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                                {msg.message}
                            </div>
                        </div>

                        {/* AI Response or Loading */}
                        <div className="flex justify-start">
                            <div className="max-w-[80%] bg-white dark:bg-emerald-900 p-3 rounded-2xl rounded-tl-none shadow-sm border border-emerald-100 dark:border-emerald-800 text-sm">
                                {msg.status === 'PROCESSING' || (msg.status === 'PENDING' && loading) ? (
                                    <div className="flex gap-1 py-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                ) : msg.response ? (
                                    <div className="whitespace-pre-wrap leading-relaxed text-emerald-950 dark:text-emerald-50">
                                        {msg.response}
                                    </div>
                                ) : msg.status === 'FAILED' ? (
                                    <div className="flex items-center gap-2 text-red-500 font-medium italic">
                                        <AlertCircle size={16} />
                                        Yanıt oluşturulamadı.
                                    </div>
                                ) : null}
                                <div className="text-[10px] text-emerald-600/40 dark:text-emerald-400/40 mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs text-center">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-emerald-950 border-t border-emerald-100 dark:border-emerald-800">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Yardım isteyin..."
                        disabled={loading}
                        className="w-full bg-emerald-50 dark:bg-emerald-900/50 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

