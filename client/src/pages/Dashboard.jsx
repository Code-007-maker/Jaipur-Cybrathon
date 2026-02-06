import { useAuth } from '../context/AuthContext';
import { QrCode, Heart, Activity, AlertCircle, Calendar, Phone, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();

    const InfoCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                <Icon className={`w-6 h-6 text-blue-600`} /> {/* Using static color for now to simplify */}
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-lg font-bold text-slate-800">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Health Wallet</h1>
                    <p className="text-slate-500">Your Medical Identity & History</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors">
                    <QrCode className="w-5 h-5" />
                    Show Emergency ID
                </button>
            </header>

            {/* Vitals / Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard icon={Heart} label="Blood Type" value={user?.bloodGroup || 'O+'} color="bg-red-500" />
                <InfoCard icon={Activity} label="Age" value={user?.age || '25'} color="bg-blue-500" />
                <InfoCard icon={AlertCircle} label="Allergies" value={user?.allergies?.length || '0'} color="bg-orange-500" />
                <InfoCard icon={Calendar} label="Last Visit" value="Oct 24, 2025" color="bg-green-500" />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Personal Info & Conditions */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                            <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                                <Edit3 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Full Name</p>
                                <p className="font-semibold text-slate-800 text-lg">{user?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Email</p>
                                <p className="font-semibold text-slate-800 text-lg">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Phone</p>
                                <p className="font-semibold text-slate-800 text-lg">{user?.phone || '+1 (555) 000-0000'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Address</p>
                                <p className="font-semibold text-slate-800 text-lg">{user?.address || 'San Francisco, CA'}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Medical Profile</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">Chronic Conditions</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Asthma', 'Hypertension'].map((c) => (
                                        <span key={c} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">Allergies</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Peanuts', 'Penicillin'].map((c) => (
                                        <span key={c} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Emergency Contacts & Quick Actions */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Emergency Contacts</h2>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Sarah Doe</p>
                                        <p className="text-xs text-slate-500">Wife • +1 (555) 123-4567</p>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                + Add Contact
                            </button>
                        </div>
                    </motion.div>

                    {/* Timeline Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Past Emergencies</h2>
                        <div className="space-y-6 relative pl-4 border-l-2 border-slate-100">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white"></div>
                                <p className="text-sm text-slate-500 mb-1">Dec 10, 2024</p>
                                <p className="font-semibold text-slate-800">Severe Allergic Reaction</p>
                                <p className="text-xs text-slate-500">St. Mary's Hospital • Discharged</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full ring-4 ring-white"></div>
                                <p className="text-sm text-slate-500 mb-1">Nov 05, 2024</p>
                                <p className="font-semibold text-slate-800">Routine Checkup</p>
                                <p className="text-xs text-slate-500">City Clinic • Complete</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
