import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import api from '../utils/api';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

const Chat = () => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: t('chat.greeting') }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Transform messages for API context need (simple for now)
            // Ideally we pass the last few messages as context
            const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));

            const res = await api.post('/chat', { message: userMessage.content, history });
            const botMessage = { role: 'assistant', content: res.data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: t('chat.errorMessage') }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-600 p-4 text-white flex items-center gap-3 shadow-md z-10">
                <div className="bg-white/20 p-2 rounded-full">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg">{t('chat.title')}</h1>
                    <p className="text-blue-100 text-xs text-opacity-80">{t('chat.subtitle')}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={clsx(
                            "flex gap-3 max-w-[80%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            msg.role === 'user' ? "bg-slate-800 text-white" : "bg-blue-600 text-white"
                        )}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={clsx(
                            "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? "bg-slate-800 text-white rounded-tr-none"
                                : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-xs text-slate-500 font-medium">{t('chat.thinking')}</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder={t('chat.placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
