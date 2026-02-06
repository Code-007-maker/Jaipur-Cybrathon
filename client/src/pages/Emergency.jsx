import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Phone, Shield, Search, CheckCircle, Ambulance } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import clsx from 'clsx';

const Emergency = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const steps = [
        { id: 'searching', label: t('emergency.searching'), icon: Search },
        { id: 'assigned', label: t('emergency.assigned'), icon: Shield },
        { id: 'en_route', label: t('emergency.enRoute'), icon: Ambulance },
        { id: 'arrived', label: t('emergency.arrived'), icon: CheckCircle },
    ];

    const [activeCase, setActiveCase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActive = async () => {
            try {
                const res = await api.get('/emergency/active');
                setActiveCase(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchActive();

        // Socket Connection
        const newSocket = io('http://localhost:5000');

        if (user?.id) {
            newSocket.on(`emergency_update_${user.id}`, (updatedCase) => {
                console.log("Update received", updatedCase);
                setActiveCase(updatedCase);
            });
        }

        return () => newSocket.close();
    }, [user?.id]);

    const getCurrentStepIndex = () => {
        if (!activeCase) return -1;
        return steps.findIndex(s => s.id === activeCase.status);
    };

    if (loading) return (
        <div className={clsx(
            "p-10 text-center",
            isDarkMode ? "text-slate-300" : "text-slate-600"
        )}>{t('emergency.loading')}</div>
    );

    if (!activeCase || activeCase.status === 'cancelled' || activeCase.status === 'resolved') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Shield className={clsx(
                    "w-20 h-20 mb-6",
                    isDarkMode ? "text-slate-600" : "text-slate-300"
                )} />
                <h2 className={clsx(
                    "text-2xl font-bold",
                    isDarkMode ? "text-white" : "text-slate-900"
                )}>{t('emergency.noActive')}</h2>
                <p className={clsx(
                    "max-w-md mt-2",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                )}>{t('emergency.safeMessage')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className={clsx(
                "rounded-3xl p-6 text-white shadow-xl",
                isDarkMode ? "bg-red-700 shadow-red-900/30" : "bg-red-600 shadow-red-200"
            )}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{t('emergency.title')}</h1>
                        <p className="opacity-90 mt-1">{t('emergency.status')}: <span className="uppercase font-bold tracking-wider">{activeCase.status.replace('_', ' ')}</span></p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full animate-pulse">
                        <Phone className="w-8 h-8" />
                    </div>
                </div>

                {/* Status Tracker */}
                <div className="flex items-center justify-between px-2 md:px-10 mb-8 relative">
                    {/* Progress Bar Line */}
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-white/20 -z-10 transform -translate-y-1/2 mx-6 md:mx-14 hidden md:block"></div>

                    {steps.map((step, idx) => {
                        const isCompleted = idx <= getCurrentStepIndex();
                        const isCurrent = idx === getCurrentStepIndex();
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 relative">
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                                    isCompleted ? "bg-white text-red-600 border-white" : "bg-red-800 text-red-400 border-red-700",
                                    isCurrent && "scale-125 shadow-lg"
                                )}>
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <span className={clsx(
                                    "text-xs font-medium md:text-sm absolute -bottom-8 whitespace-nowrap transition-opacity",
                                    isCompleted ? "opacity-100" : "opacity-50"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Responder Details */}
                {activeCase.assignedResponder && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "p-6 rounded-3xl border shadow-lg transition-colors",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                        )}
                    >
                        <h3 className={clsx(
                            "text-lg font-bold mb-4 flex items-center gap-2",
                            isDarkMode ? "text-white" : "text-slate-900"
                        )}>
                            <Ambulance className="w-5 h-5 text-blue-600" /> {t('emergency.responderAssigned')}
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={clsx(
                                "w-16 h-16 rounded-full flex items-center justify-center",
                                isDarkMode ? "bg-slate-700" : "bg-slate-100"
                            )}>
                                <span className={clsx(
                                    "font-bold text-2xl",
                                    isDarkMode ? "text-slate-300" : "text-slate-600"
                                )}>42</span>
                            </div>
                            <div>
                                <p className={clsx(
                                    "text-xl font-bold",
                                    isDarkMode ? "text-white" : "text-slate-900"
                                )}>{activeCase.assignedResponder.name}</p>
                                <p className={clsx(
                                    isDarkMode ? "text-slate-400" : "text-slate-500"
                                )}>{activeCase.assignedResponder.vehicleId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={clsx(
                                "p-3 rounded-xl",
                                isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                            )}>
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">{t('emergency.estimatedArrival')}</p>
                                <p className={clsx(
                                    "text-xl font-bold",
                                    isDarkMode ? "text-blue-300" : "text-blue-900"
                                )}>{activeCase.assignedResponder.eta}</p>
                            </div>
                            <div className={clsx(
                                "p-3 rounded-xl",
                                isDarkMode ? "bg-green-900/30" : "bg-green-50"
                            )}>
                                <p className="text-xs text-green-600 font-bold uppercase mb-1">{t('emergency.contact')}</p>
                                <p className={clsx(
                                    "text-xl font-bold",
                                    isDarkMode ? "text-green-300" : "text-green-900"
                                )}>{activeCase.assignedResponder.phone}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Map Placeholder */}
                <div className={clsx(
                    "rounded-3xl min-h-[300px] flex items-center justify-center relative overflow-hidden group",
                    isDarkMode ? "bg-slate-700" : "bg-slate-200"
                )}>
                    <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/13/1310/3166.png')] bg-cover opacity-50"></div>
                    <div className="relative z-10 text-center">
                        <MapPin className={clsx(
                            "w-12 h-12 mx-auto mb-2",
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                        )} />
                        <p className={clsx(
                            "font-bold",
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                        )}>{t('emergency.liveLocation')}</p>
                        <p className={clsx(
                            "text-sm",
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                        )}>{t('emergency.mapLoading')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Emergency;
