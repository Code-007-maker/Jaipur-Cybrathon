import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { MapPin, Phone, Shield, Search, CheckCircle, Ambulance } from 'lucide-react';
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
                <div className="bg-slate-200 rounded-3xl min-h-[300px] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/13/1310/3166.png')] bg-cover opacity-50"></div>
                    <div className="relative z-10 text-center">
                        <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-600">Live Location Tracking</p>
                        <p className="text-sm text-slate-500">Map view is loading...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Emergency;
