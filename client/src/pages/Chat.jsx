import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

const Chat = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

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
        <div className={clsx(
            "max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col rounded-3xl shadow-xl overflow-hidden border transition-colors",
            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}>
            <div className="bg-blue-600 p-4 text-white flex items-center gap-3 shadow-md z-10">
                <div className="bg-white/20 p-2 rounded-full">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg">{t('chat.title')}</h1>
                    <p className="text-blue-100 text-xs text-opacity-80">{t('chat.subtitle')}</p>
                </div>
            </div>

            <div className={clsx(
                "flex-1 overflow-y-auto p-4 space-y-4 transition-colors",
                isDarkMode ? "bg-slate-900" : "bg-slate-50"
            )} ref={scrollRef}>
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
                            msg.role === 'user'
                                ? (isDarkMode ? "bg-slate-600 text-white" : "bg-slate-800 text-white")
                                : "bg-blue-600 text-white"
                        )}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={clsx(
                            "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? (isDarkMode
                                    ? "bg-slate-700 text-white rounded-tr-none"
                                    : "bg-slate-800 text-white rounded-tr-none")
                                : (isDarkMode
                                    ? "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none")
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
                        <div className={clsx(
                            "p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 border",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                        )}>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className={clsx(
                                "text-xs font-medium",
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                            )}>{t('chat.thinking')}</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className={clsx(
                "p-4 border-t transition-colors",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
            )}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className={clsx(
                            "flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border",
                            isDarkMode
                                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-500"
                        )}
                        placeholder={t('chat.placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className={clsx(
                            "bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg",
                            isDarkMode ? "shadow-blue-900/30" : "shadow-blue-200"
                        )}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
