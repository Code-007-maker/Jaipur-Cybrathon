import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SOSButton from './SOSButton';
import SessionTimer from './SessionTimer';
import { Activity, Home, FileText, MessageSquare, LogOut, Menu, X, Ambulance, ShieldCheck, FolderHeart } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Languages } from 'lucide-react';

const Layout = ({ children }) => {
    const { isAuthenticated, logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { i18n, t } = useTranslation();

    const languages = ['en', 'hi', 'mr', 'bn', 'ta', 'te'];
    const languageNames = { en: 'EN', hi: 'हिं', mr: 'मर', bn: 'বা', ta: 'த', te: 'తె' };

    const toggleLanguage = () => {
        const currentIndex = languages.indexOf(i18n.language);
        const nextIndex = (currentIndex + 1) % languages.length;
        i18n.changeLanguage(languages[nextIndex]);
    };

    // If not authenticated, just render children (like login page)
    // This layout handles mostly the authenticated app shell
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
        // In a real app we might redirect here, but for now we let the Router handle protections
    }

    const navItems = [
        { name: t('nav.dashboard'), path: '/', icon: Home },
        { name: t('nav.triage'), path: '/triage', icon: Activity },
        { name: t('nav.emergency'), path: '/emergency', icon: Ambulance, className: 'text-red-500 font-bold' },
        { name: t('nav.findHospital'), path: '/map', icon: FileText },
        { name: t('nav.aiMedic'), path: '/chat', icon: MessageSquare },
        { name: 'Health Vault', path: '/reports', icon: FolderHeart },
    ].filter(item => user?.role === 'doctor' ? item.path === '/reports' : true);

    return (
        <div className={clsx(
            'min-h-screen relative overflow-hidden transition-colors duration-300',
            theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
        )}>
            {/* Mobile Header */}
            <div className={clsx(
                "lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md shadow-sm fixed top-0 w-full z-50",
                theme === 'dark' ? 'bg-slate-800/80 border-b border-slate-700' : 'bg-white/80'
            )}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Activity className="text-white w-5 h-5" />
                    </div>
                    <span className={clsx("font-bold text-xl", theme === 'dark' ? 'text-white' : 'text-slate-800')}>CareGrid</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar */}
            {isAuthenticated && (
                <aside className={clsx(
                    "hidden lg:flex flex-col w-64 border-r h-screen fixed left-0 top-0 z-40 transition-colors duration-300",
                    theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                )}>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Activity className="text-white w-6 h-6" />
                            </div>
                            <span className={clsx("font-bold text-2xl tracking-tight", theme === 'dark' ? 'text-white' : 'text-slate-800')}>CareGrid<span className="text-blue-600">AI</span></span>
                        </div>
                    </div>

                    <div className="px-6 mb-4 flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-1 flex justify-center">
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                        </button>
                        <button onClick={toggleLanguage} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-1 flex items-center justify-center gap-2 font-medium">
                            <Languages className="w-5 h-5" />
                            <span className="text-xs">{languageNames[i18n.language] || i18n.language.toUpperCase()}</span>
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                    location.pathname === item.path
                                        ? (theme === 'dark' ? 'bg-blue-900/40 text-blue-400 shadow-sm' : 'bg-blue-50 text-blue-700 font-medium shadow-sm')
                                        : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'),
                                    item.className
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className={clsx("p-4 border-t", theme === 'dark' ? 'border-slate-700' : 'border-slate-100')}>
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold relative group">
                                {user?.role === 'doctor' ? <ShieldCheck className="w-6 h-6 text-emerald-500" /> : (user?.name?.[0] || 'U')}
                            </div>
                            <div>
                                <p className={clsx("text-sm font-semibold truncate w-32", theme === 'dark' ? 'text-white' : 'text-slate-800')}>
                                    {user?.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {user?.role === 'doctor' ? 'Secure Access' : 'Patient ID: #8821'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-2 w-full rounded-lg transition-colors",
                                theme === 'dark' ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            )}
                        >
                            <LogOut className="w-5 h-5" />
                            {t('nav.signOut')}
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden fixed inset-0 z-[60] bg-white pt-24 px-4 pb-6"
                    >
                        <nav className="space-y-4">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <span className="font-semibold dark:text-white">Settings</span>
                                <div className="flex gap-4">
                                    <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                        {theme === 'light' ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                                    </button>
                                    <button onClick={toggleLanguage} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                                        <Languages className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                        <span className="text-xs font-bold dark:text-white">{languageNames[i18n.language] || i18n.language.toUpperCase()}</span>
                                    </button>
                                </div>
                            </div>
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={clsx(
                                        'flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium border transition-colors',
                                        location.pathname === item.path
                                            ? (theme === 'dark' ? 'bg-blue-900/40 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100')
                                            : (theme === 'dark' ? 'text-slate-300 bg-slate-800 border-slate-700' : 'text-slate-600 bg-white border-slate-100')
                                    )}
                                >
                                    <item.icon className="w-6 h-6" />
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMobileMenuOpen(false);
                                }}
                                className={clsx(
                                    "flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium w-full mt-8",
                                    theme === 'dark' ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50'
                                )}
                            >
                                <LogOut className="w-6 h-6" />
                                {t('nav.signOut')}
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={clsx('min-h-screen transition-all duration-300', isAuthenticated ? 'lg:pl-64 pt-20 lg:pt-0' : '')}>
                {isAuthenticated && <SessionTimer />}
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
                {isAuthenticated && user?.role !== 'doctor' && <SOSButton />}
            </main>
        </div>
    );
};

export default Layout;
