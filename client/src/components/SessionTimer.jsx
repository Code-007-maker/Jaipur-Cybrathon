import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, LogOut, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const SessionTimer = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (user && user.role === 'doctor' && user.expiresAt) {
            const calculateTimeLeft = () => {
                const difference = user.expiresAt - Date.now();
                if (difference <= 0) {
                    logout();
                    navigate('/login');
                    return 0;
                }
                return Math.floor(difference / 1000);
            };

            setTimeLeft(calculateTimeLeft());

            const timer = setInterval(() => {
                const left = calculateTimeLeft();
                setTimeLeft(left);
                if (left <= 0) clearInterval(timer);
            }, 1000);

            return () => clearInterval(timer);
        } else {
            setTimeLeft(null);
        }
    }, [user, logout, navigate]);

    if (!timeLeft || !user || user.role !== 'doctor') return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
            >
                <div className={clsx(
                    "backdrop-blur-xl border-2 p-1.5 rounded-full shadow-2xl flex items-center justify-between gap-4 overflow-hidden",
                    timeLeft < 300
                        ? "bg-red-500/10 border-red-500/30 text-red-500"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                )}>
                    {/* Progress Bar Background */}
                    <div className="absolute inset-0 bg-white/5 -z-10" />

                    <div className="flex items-center gap-3 ml-3">
                        <div className={clsx(
                            "p-2 rounded-full",
                            timeLeft < 300 ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                            <Timer className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Doctor Session</span>
                            <span className="text-sm font-black tabular-nums">
                                {minutes}:{seconds.toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block text-right mr-2">
                            <p className="text-[10px] font-bold opacity-70 uppercase">Viewing Patient</p>
                            <p className="text-xs font-black truncate max-w-[120px]">{user.patientName}</p>
                        </div>
                        <button
                            onClick={() => logout()}
                            className={clsx(
                                "p-2.5 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 pr-4 pl-3",
                                timeLeft < 300
                                    ? "bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white"
                                    : "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white"
                            )}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-xs font-bold">End Session</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SessionTimer;
