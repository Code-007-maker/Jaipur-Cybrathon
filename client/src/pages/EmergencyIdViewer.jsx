import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    User,
    Heart,
    Activity,
    AlertTriangle,
    Phone,
    Droplets,
    Shield,
    AlertCircle,
    Clock
} from 'lucide-react';

const EmergencyIdViewer = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [healthData, setHealthData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const dataParam = searchParams.get('data');
            if (dataParam) {
                const decoded = decodeURIComponent(dataParam);
                const parsed = JSON.parse(decoded);
                setHealthData(parsed);
            } else {
                setError('No health data provided');
            }
        } catch (err) {
            console.error('Error parsing health data:', err);
            setError('Invalid health data format');
        }
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!healthData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-pulse text-blue-600 font-semibold">Loading health data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                {/* Emergency Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-6 mb-6 shadow-xl shadow-red-200">
                    <div className="flex items-center gap-4 text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Shield className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Emergency Health ID</h1>
                            <p className="opacity-90 text-sm">CareGrid AI Medical Records</p>
                        </div>
                    </div>
                </div>

                {/* Patient Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 mb-6"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{healthData.name || 'Unknown'}</h2>
                            <p className="text-slate-500">{healthData.phone || 'No phone provided'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Blood Type */}
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Droplets className="w-5 h-5 text-red-500" />
                                <span className="text-sm font-medium text-red-700">Blood Type</span>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{healthData.bloodGroup || 'N/A'}</p>
                        </div>

                        {/* Age */}
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700">Age</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{healthData.age || 'N/A'}</p>
                        </div>

                        {/* Timestamp */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Generated</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-600">
                                {healthData.generatedAt ? new Date(healthData.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Allergies Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 mb-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Allergies</h3>
                            <p className="text-sm text-slate-500">Known allergic reactions</p>
                        </div>
                    </div>

                    {healthData.allergies && healthData.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {healthData.allergies.map((allergy, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-medium text-sm border border-orange-200"
                                >
                                    ⚠️ {allergy}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl">
                            <p className="font-medium">No known allergies</p>
                        </div>
                    )}
                </motion.div>

                {/* Chronic Conditions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 mb-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Heart className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Chronic Conditions</h3>
                            <p className="text-sm text-slate-500">Ongoing medical conditions</p>
                        </div>
                    </div>

                    {healthData.chronicConditions && healthData.chronicConditions.length > 0 ? (
                        <div className="space-y-2">
                            {healthData.chronicConditions.map((condition, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"
                                >
                                    <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-amber-700 font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <span className="font-medium text-amber-800">{condition}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl">
                            <p className="font-medium">No chronic conditions recorded</p>
                        </div>
                    )}
                </motion.div>

                {/* Emergency Contacts Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 mb-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Emergency Contacts</h3>
                            <p className="text-sm text-slate-500">People to contact in emergency</p>
                        </div>
                    </div>

                    {healthData.emergencyContacts && healthData.emergencyContacts.length > 0 ? (
                        <div className="space-y-3">
                            {healthData.emergencyContacts.map((contact, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{contact.name || 'Unknown'}</p>
                                            <p className="text-sm text-slate-500">{contact.relation || 'Contact'}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                                    >
                                        📞 Call
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl">
                            <p className="font-medium">No emergency contacts listed</p>
                        </div>
                    )}
                </motion.div>

                {/* Footer */}
                <div className="text-center py-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        Powered by CareGrid AI
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                        This health record is for emergency use only.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default EmergencyIdViewer;
