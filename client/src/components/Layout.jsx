import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SOSButton from './SOSButton';
import { Activity, Home, FileText, MessageSquare, LogOut, Menu, X, Ambulance } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
    const { isAuthenticated, logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // If not authenticated, just render children (like login page)
    // This layout handles mostly the authenticated app shell
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
        // In a real app we might redirect here, but for now we let the Router handle protections
    }

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Triage', path: '/triage', icon: Activity },
        { name: 'Emergency', path: '/emergency', icon: Ambulance, className: 'text-red-500 font-bold' },
        { name: 'Find Hospital', path: '/map', icon: FileText }, // Placeholder icon choice
        { name: 'AI Medic', path: '/chat', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md shadow-sm fixed top-0 w-full z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Activity className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-slate-800">CareGrid</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Desktop Sidebar */}
            {isAuthenticated && (
                <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-40">
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Activity className="text-white w-6 h-6" />
                        </div>
                        <span className="font-bold text-2xl text-slate-800 tracking-tight">CareGrid<span className="text-blue-600">AI</span></span>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                    location.pathname === item.path
                                        ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                                    item.className
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                {user?.name?.[0] || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 truncate w-32">{user?.name}</p>
                                <p className="text-xs text-slate-500">Patient ID: #8821</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-600 w-full rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
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
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={clsx(
                                        'flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium border border-slate-100',
                                        location.pathname === item.path
                                            ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm'
                                            : 'text-slate-600 bg-white'
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
                                className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-red-600 bg-red-50 w-full mt-8"
                            >
                                <LogOut className="w-6 h-6" />
                                Sign Out
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={clsx('min-h-screen transition-all duration-300', isAuthenticated ? 'lg:pl-64 pt-20 lg:pt-0' : '')}>
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
                {isAuthenticated && <SOSButton />}
            </main>
        </div>
    );
};

export default Layout;
