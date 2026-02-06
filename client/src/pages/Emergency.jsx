import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Phone, Shield, Search, CheckCircle, Ambulance, Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import api from '../utils/api';
import clsx from 'clsx';

const steps = [
    { id: 'searching', label: 'Searching', icon: Search },
    { id: 'assigned', label: 'Responder Assigned', icon: Shield },
    { id: 'en_route', label: 'En Route', icon: Ambulance },
    { id: 'arrived', label: 'Arrived', icon: CheckCircle },
];

const Emergency = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [activeCase, setActiveCase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const navigate = useNavigate();

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

    const handleResolve = async () => {
        setIsResolving(true);
        try {
            await api.post('/emergency/resolve', { caseId: activeCase._id });
            setActiveCase(null);
            navigate('/'); // Go back to dashboard to see history
        } catch (err) {
            console.error(err);
            alert("Failed to resolve case");
        } finally {
            setIsResolving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Emergency Status...</div>;
    if (!activeCase || activeCase.status === 'cancelled' || activeCase.status === 'resolved') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Shield className="w-20 h-20 text-slate-300 mb-6" />
                <h2 className="text-2xl font-bold text-slate-900">No Active Emergency</h2>
                <p className="text-slate-500 max-w-md mt-2">You are safe. Use the SOS button if you need immediate assistance.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-red-600 rounded-3xl p-6 text-white shadow-xl shadow-red-200">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Emergency Active</h1>
                        <p className="opacity-90 mt-1">Status: <span className="uppercase font-bold tracking-wider">{activeCase.status.replace('_', ' ')}</span></p>
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
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg"
                    >
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Ambulance className="w-5 h-5 text-blue-600" /> Responder Assigned
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <span className="font-bold text-2xl text-slate-600">42</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{activeCase.assignedResponder.name}</p>
                                <p className="text-slate-500">{activeCase.assignedResponder.vehicleId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Estimated Arrival</p>
                                <p className="text-xl font-bold text-blue-900">{activeCase.assignedResponder.eta}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-xl">
                                <p className="text-xs text-green-600 font-bold uppercase mb-1">Contact</p>
                                <p className="text-xl font-bold text-green-900">{activeCase.assignedResponder.phone}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Map Placeholder */}
                <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl min-h-[300px] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/13/1310/3166.png')] bg-cover opacity-50 dark:opacity-20"></div>
                    <div className="relative z-10 text-center">
                        <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-600 dark:text-slate-400">Live Location Tracking</p>
                        <p className="text-sm text-slate-500">Map view is loading...</p>
                    </div>
                </div>
            </div>

            {/* Notifications and Resolution */}
            <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "p-6 rounded-3xl border shadow-lg",
                        theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                    )}
                >
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-orange-500" /> Emergency Contacts Notified
                    </h3>
                    <div className="space-y-3">
                        {activeCase.notificationsSent?.length > 0 ? (
                            activeCase.notificationsSent.map((n, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm tracking-tight">{n.contactName}</p>
                                        <p className="text-[10px] text-slate-500">{n.phone}</p>
                                        {n.email && <p className="text-[10px] text-blue-500 italic truncate max-w-[120px]">{n.email}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                        <Check className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">{n.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 italic">No contacts registered for notification.</p>
                        )}
                    </div>
                </motion.div>

                {activeCase.status === 'arrived' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-green-600 rounded-3xl text-white shadow-xl shadow-green-200 flex flex-col items-center justify-center text-center"
                    >
                        <CheckCircle className="w-12 h-12 mb-3" />
                        <h3 className="text-xl font-bold mb-2">Assistance has Arrived</h3>
                        <p className="text-sm opacity-90 mb-6">Are you safe? Marking this as complete will save it to your history.</p>
                        <button
                            onClick={handleResolve}
                            disabled={isResolving}
                            className="w-full py-4 bg-white text-green-600 rounded-2xl font-black text-lg hover:bg-green-50 transition-colors"
                        >
                            {isResolving ? "SAVING..." : "MARK AS SAFE & COMPLETE"}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Emergency;
