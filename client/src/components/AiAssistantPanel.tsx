import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { FileSearch, Send, Sparkles, ShieldCheck, Car, Home } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context?: {
    source_type: string;
    source_id: string;
    snippet: string;
    gcs_path?: string | null;
    score: number;
  }[];
};

export default function AiAssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const history = useMemo(
    () => messages.map((msg) => ({ role: msg.role, content: msg.content })),
    [messages]
  );

  const scrollToBottom = () => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    setLastQuery(content.trim());

    try {
      const response = await axios.post(
        '/api/assistant/chat',
        {
          query: userMessage.content,
          history,
        },
        { timeout: 15000 }
      );
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.answer || 'Cevap alinmadi.',
        context: response.data.context || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
        setError('Yanıt zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        setError('Asistan servisine ulaşılamadı. Lütfen tekrar deneyin.');
      }
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Su anda yanit uretilemedi. Lutfen tekrar deneyin.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
      requestAnimationFrame(scrollToBottom);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;
    await sendMessage(input.trim());
  };

  const retryLast = async () => {
    if (!lastQuery || loading) return;
    setInput(lastQuery);
  };

  return (
    <section className="relative flex h-[600px] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-100 shadow-[0_20px_60px_rgba(120,82,20,0.18)]">
      <div className="flex items-center justify-between border-b border-amber-200/60 bg-white/70 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">ZenithCRM AI</p>
          <h2 className="text-lg font-semibold text-slate-900">Asistan Paneli</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Sparkles size={18} />
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
        <div className="flex flex-wrap gap-2">
          {[
            { text: 'Policelerimde en yuksek limitli konut policesini bul', icon: Home },
            { text: 'Gecen ayki tampon hasari fotograflarini getir', icon: FileSearch },
            { text: 'Kirmizi bir aracin karistigi kazalari goster', icon: Car },
            { text: 'Kapsami en genis saglik policeleri', icon: ShieldCheck },
          ].map((suggestion) => {
            const Icon = suggestion.icon;
            return (
            <button
              key={suggestion.text}
              type="button"
              onClick={() => sendMessage(suggestion.text)}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-400 hover:text-amber-800"
            >
              <Icon size={14} />
              {suggestion.text}
            </button>
          )})}
        </div>
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-amber-200/50 bg-white/70 p-4 text-sm text-slate-700 shadow-sm">
            Ornek: "Policelerimde en yuksek limitli konut policesini bul" veya
            "Gecen ayki tampon hasari fotograflarini getir".
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'ml-auto bg-amber-500 text-white'
                  : 'mr-auto bg-white text-slate-800'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && msg.context && msg.context.length > 0 && (
                <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                  <div className="font-semibold uppercase tracking-[0.18em] text-amber-600">Kaynaklar</div>
                  {msg.context.slice(0, 3).map((item) => (
                    <div key={`${item.source_type}-${item.source_id}`} className="rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-2">
                      <div className="text-[10px] font-semibold text-amber-700">
                        {item.source_type} • {item.source_id.slice(0, 8)}
                      </div>
                      <div className="mt-1 line-clamp-3">{item.snippet}</div>
                      {item.gcs_path && (
                        <a
                          href={item.gcs_path}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-[10px] font-semibold text-amber-700 underline underline-offset-4"
                        >
                          Dosyayi Ac
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="mr-auto w-fit rounded-2xl bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
            Yanit hazirlaniyor...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-sm">
            {error}
            {lastQuery && (
              <button
                type="button"
                onClick={retryLast}
                className="ml-3 text-xs font-semibold text-amber-700 underline underline-offset-4"
              >
                Son soruyu tekrar gonder
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-amber-200/60 bg-white/80 p-4">
        <div className="relative flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Soru yazin..."
            className="w-full rounded-2xl border border-amber-200/60 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
