import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Register = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.msg || t('register.registerFailed'));
        }
    };

    return (
        <div className={clsx(
            "min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors",
            isDarkMode ? "bg-slate-900" : "bg-slate-50"
        )}>
            {/* Background blobs */}
            <div className={clsx(
                "absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2",
                isDarkMode ? "bg-purple-900/30" : "bg-purple-200/50"
            )}></div>
            <div className={clsx(
                "absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2",
                isDarkMode ? "bg-blue-900/30" : "bg-blue-200/50"
            )}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={clsx(
                    "w-full max-w-md backdrop-blur-xl p-8 rounded-3xl shadow-2xl border relative z-10",
                    isDarkMode
                        ? "bg-slate-800/80 border-slate-700/50"
                        : "bg-white/80 border-white/50"
                )}
            >
                <div className="text-center mb-8">
                    <div className={clsx(
                        "w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl",
                        isDarkMode ? "shadow-blue-900/30" : "shadow-blue-200"
                    )}>
                        <Activity className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('register.title')}</h1>
                    <p className="text-slate-500">{t('register.subtitle')}</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "p-3 rounded-lg mb-6 text-sm flex items-center justify-center font-medium",
                            isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
                        )}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.fullName')}</label>
                        <input
                            type="text"
                            placeholder={t('register.namePlaceholder')}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all block"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.email')}</label>
                        <input
                            type="email"
                            placeholder={t('register.emailPlaceholder')}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all block"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.password')}</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all block"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-2"
                    >
                        {t('register.getStarted')}
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-slate-500">{t('register.hasAccount')} <Link to="/login" className="text-blue-600 font-semibold hover:underline">{t('register.signIn')}</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
