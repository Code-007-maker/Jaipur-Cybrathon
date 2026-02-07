import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Activity, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const Register = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            console.error('Register error:', err);
            setError(err.msg || err.message || t('register.registerFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={clsx(
            "fixed inset-0 flex items-center justify-center p-6 overflow-hidden transition-colors duration-500",
            isDarkMode ? "bg-slate-950" : "bg-slate-50"
        )}>
            {/* Immersive Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className={clsx(
                        "absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[110px] opacity-30",
                        isDarkMode ? "bg-purple-600" : "bg-purple-200"
                    )}
                />
                <motion.div
                    animate={{
                        scale: [1.3, 1, 1.3],
                        x: [0, 40, 0],
                        y: [0, -40, 0],
                    }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                    className={clsx(
                        "absolute bottom-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[110px] opacity-30",
                        isDarkMode ? "bg-blue-600" : "bg-blue-200"
                    )}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                    "w-full max-w-lg backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border relative z-10 transition-all duration-500",
                    isDarkMode
                        ? "bg-slate-900/40 border-slate-700/50"
                        : "bg-white/60 border-white/50"
                )}
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className={clsx(
                        "w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative group"
                    )}>
                        <Activity className="text-white w-12 h-12" />
                        <div className="absolute inset-0 rounded-3xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h1 className={clsx(
                        "text-4xl font-black mb-3 tracking-tight outline-none",
                        isDarkMode ? "text-white" : "text-slate-900"
                    )}>
                        {t('register.title')}
                    </h1>
                    <p className={clsx(
                        "text-lg",
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                    )}>
                        {t('register.subtitle')}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={clsx(
                                "p-4 rounded-2xl mb-6 text-sm flex items-center justify-center font-bold border",
                                isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-600"
                            )}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                            {t('register.fullName')}
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('register.namePlaceholder')}
                                className={clsx(
                                    "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                    isDarkMode
                                        ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                                        : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:shadow-xl focus:shadow-blue-100"
                                )}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                            {t('register.email')}
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="email"
                                placeholder={t('register.emailPlaceholder')}
                                className={clsx(
                                    "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                    isDarkMode
                                        ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                                        : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:shadow-xl focus:shadow-blue-100"
                                )}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                            {t('register.password')}
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={clsx(
                                    "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                    isDarkMode
                                        ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                                        : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:shadow-xl focus:shadow-blue-100"
                                )}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                            "w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-3 mt-4"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                {t('register.getStarted')}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className={clsx(
                        "font-medium",
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                    )}>
                        {t('register.hasAccount')}{" "}
                        <Link to="/login" className="text-blue-500 font-bold hover:text-blue-600 transition-colors font-bold">
                            {t('register.signIn')}
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
