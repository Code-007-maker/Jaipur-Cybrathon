import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, Heart, Activity, AlertCircle, Calendar, Phone, Edit3, MapPin, Save, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const Dashboard = () => {
    const { user, updateProfile } = useAuth();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingMedical, setIsEditingMedical] = useState(false);
    const [isEditingEmergency, setIsEditingEmergency] = useState(false);

    const [formData, setFormData] = useState({
        phone: user?.phone || '',
        address: user?.address || '',
        age: user?.age || '',
        bloodGroup: user?.bloodGroup || '',
        allergies: user?.allergies || [],
        chronicConditions: user?.chronicConditions || [],
        emergencyContacts: user?.emergencyContacts || []
    });

    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                address: user.address || '',
                age: user.age || '',
                bloodGroup: user.bloodGroup || '',
                allergies: user.allergies || [],
                chronicConditions: user.chronicConditions || [],
                emergencyContacts: user.emergencyContacts || []
            });
        }
    }, [user]);

    const handleFetchLocation = () => {
        setLocationLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const address = data.display_name;
                    setFormData(prev => ({ ...prev, address }));
                } catch (error) {
                    console.error("Error reverse geocoding:", error);
                    setFormData(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                }
                setLocationLoading(false);
            }, (error) => {
                console.error("Error getting location:", error);
                setLocationLoading(false);
            });
        } else {
            alert("Geolocation is not supported by your browser");
            setLocationLoading(false);
        }
    };

    const handleSave = async (section) => {
        try {
            await updateProfile(formData);
            if (section === 'phone') setIsEditingPhone(false);
            if (section === 'medical') setIsEditingMedical(false);
            if (section === 'emergency') setIsEditingEmergency(false);
        } catch (error) {
            alert("Failed to update profile");
        }
    };

    const handleAddContact = () => {
        setFormData(prev => ({
            ...prev,
            emergencyContacts: [...prev.emergencyContacts, { name: '', relation: '', phone: '' }]
        }));
    };

    const handleContactChange = (index, field, value) => {
        const updatedContacts = [...formData.emergencyContacts];
        updatedContacts[index][field] = value;
        setFormData(prev => ({ ...prev, emergencyContacts: updatedContacts }));
    };

    const handleRemoveContact = (index) => {
        setFormData(prev => ({
            ...prev,
            emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
        }));
    };

    const handleToggleMedicalItem = (listName, item) => {
        setFormData(prev => {
            const list = prev[listName];
            if (list.includes(item)) {
                return { ...prev, [listName]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [listName]: [...list, item] };
            }
        });
    };

    const isDarkMode = theme === 'dark';

    const InfoCard = ({ icon: Icon, label, value, color }) => (
        <div className={clsx(
            "p-4 rounded-2xl border transition-colors shadow-sm flex items-center gap-4",
            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
        )}>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                <Icon className={clsx("w-6 h-6", isDarkMode ? "text-blue-400" : "text-blue-600")} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className={clsx("text-lg font-bold", isDarkMode ? "text-white" : "text-slate-800")}>{value || t('dashboard.none')}</p>
            </div>
        </div>
    );

    const isFirstTime = !user?.age || !user?.bloodGroup || user?.emergencyContacts?.length === 0;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={clsx("text-3xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{t('dashboard.title')}</h1>
                    <p className="text-slate-500">{t('dashboard.subtitle')}</p>
                </div>
                <button className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors",
                    isDarkMode ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                )}>
                    <QrCode className="w-5 h-5" />
                    {t('dashboard.showEmergencyId')}
                </button>
            </header>

            {isFirstTime && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <AlertCircle className="w-8 h-8" />
                        <div>
                            <p className="font-bold">Complete Your Profile</p>
                            <p className="text-sm text-blue-100">Please provide your medical details and emergency contacts for safety.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsEditingMedical(true);
                            setIsEditingEmergency(true);
                        }}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                    >
                        Setup Now
                    </button>
                </motion.div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard icon={Heart} label={t('dashboard.bloodType')} value={formData.bloodGroup} color="bg-red-500" />
                <InfoCard icon={Activity} label={t('dashboard.age')} value={formData.age} color="bg-blue-500" />
                <InfoCard icon={AlertCircle} label={t('dashboard.allergies')} value={formData.allergies?.length || '0'} color="bg-orange-500" />
                <InfoCard icon={Calendar} label={t('dashboard.lastVisit')} value="Oct 24, 2025" color="bg-green-500" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "rounded-3xl p-6 border transition-colors shadow-sm",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                        )}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{t('dashboard.personalInfo')}</h2>
                            {!isEditingPhone ? (
                                <button
                                    onClick={() => setIsEditingPhone(true)}
                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors dark:hover:bg-blue-900/30"
                                >
                                    <Edit3 className="w-5 h-5" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingPhone(false)} className="text-slate-400 p-2"><X className="w-5 h-5" /></button>
                                    <button onClick={() => handleSave('phone')} className="text-green-500 p-2"><Save className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">{t('dashboard.fullName')}</p>
                                <p className={clsx("font-semibold text-lg", isDarkMode ? "text-slate-200" : "text-slate-800")}>{user?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">{t('dashboard.email')}</p>
                                <p className={clsx("font-semibold text-lg", isDarkMode ? "text-slate-200" : "text-slate-800")}>{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">{t('dashboard.phone')}</p>
                                {isEditingPhone ? (
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className={clsx(
                                            "w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-colors",
                                            isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                        )}
                                    />
                                ) : (
                                    <p className={clsx("font-semibold text-lg", isDarkMode ? "text-slate-200" : "text-slate-800")}>{formData.phone || t('dashboard.none')}</p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm text-slate-500">{t('dashboard.address')}</p>
                                    {isEditingPhone && (
                                        <button
                                            onClick={handleFetchLocation}
                                            disabled={locationLoading}
                                            className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            {locationLoading ? "Fetching..." : t('dashboard.liveLocation')}
                                        </button>
                                    )}
                                </div>
                                {isEditingPhone ? (
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        className={clsx(
                                            "w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-colors resize-none",
                                            isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                        )}
                                        rows={2}
                                    />
                                ) : (
                                    <p className={clsx("font-semibold text-lg leading-tight", isDarkMode ? "text-slate-200" : "text-slate-800")}>{formData.address || t('dashboard.none')}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={clsx(
                            "rounded-3xl p-6 border transition-colors shadow-sm",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{t('dashboard.medicalProfile')}</h2>
                            {!isEditingMedical ? (
                                <button onClick={() => setIsEditingMedical(true)} className="text-blue-600 p-2"><Edit3 className="w-5 h-5" /></button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingMedical(false)} className="text-slate-400 p-2"><X className="w-5 h-5" /></button>
                                    <button onClick={() => handleSave('medical')} className="text-green-500 p-2"><Save className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {isEditingMedical && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Blood Group</p>
                                        <select
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                            className={clsx("w-full p-2 rounded-lg border", isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200")}
                                        >
                                            <option value="">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Age</p>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                            className={clsx("w-full p-2 rounded-lg border", isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200")}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('dashboard.chronicConditions')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Asthma', 'Hypertension', 'Diabetes', 'Arthritis'].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => isEditingMedical && handleToggleMedicalItem('chronicConditions', c)}
                                            className={clsx(
                                                "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                                                formData.chronicConditions?.includes(c)
                                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                                    : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('dashboard.allergies')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Peanuts', 'Penicillin', 'Dust', 'Lactose'].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => isEditingMedical && handleToggleMedicalItem('allergies', c)}
                                            className={clsx(
                                                "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                                                formData.allergies?.includes(c)
                                                    ? "bg-red-100 text-red-700 border-red-200"
                                                    : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={clsx(
                            "rounded-3xl p-6 border transition-colors shadow-sm",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{t('dashboard.emergencyContacts')}</h2>
                            {!isEditingEmergency ? (
                                <button onClick={() => setIsEditingEmergency(true)} className="text-blue-600 p-2"><Edit3 className="w-5 h-5" /></button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingEmergency(false)} className="text-slate-400 p-2"><X className="w-5 h-5" /></button>
                                    <button onClick={() => handleSave('emergency')} className="text-green-500 p-2"><Save className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {formData.emergencyContacts?.map((contact, i) => (
                                <div key={i} className={clsx("p-3 rounded-xl border transition-colors", isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-100")}>
                                    {isEditingEmergency ? (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Name"
                                                    value={contact.name}
                                                    onChange={(e) => handleContactChange(i, 'name', e.target.value)}
                                                    className={clsx("w-full p-2 text-sm rounded border", isDarkMode ? "bg-slate-600 border-slate-500" : "bg-white border-slate-200")}
                                                />
                                                <button onClick={() => handleRemoveContact(i)} className="text-red-500"><X className="w-4 h-4" /></button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Relation"
                                                    value={contact.relation}
                                                    onChange={(e) => handleContactChange(i, 'relation', e.target.value)}
                                                    className={clsx("w-full p-2 text-sm rounded border", isDarkMode ? "bg-slate-600 border-slate-500" : "bg-white border-slate-200")}
                                                />
                                                <input
                                                    placeholder="Phone"
                                                    value={contact.phone}
                                                    onChange={(e) => handleContactChange(i, 'phone', e.target.value)}
                                                    className={clsx("w-full p-2 text-sm rounded border", isDarkMode ? "bg-slate-600 border-slate-500" : "bg-white border-slate-200")}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={clsx("font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>{contact.name || "Unknown"}</p>
                                                <p className="text-xs text-slate-500">{contact.relation} • {contact.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isEditingEmergency && (
                                <button
                                    onClick={handleAddContact}
                                    className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mx-auto" />
                                </button>
                            )}

                            {formData.emergencyContacts?.length === 0 && !isEditingEmergency && (
                                <p className="text-center text-sm text-slate-500 py-4">No emergency contacts added.</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={clsx(
                            "rounded-3xl p-6 border transition-colors shadow-sm",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                        )}
                    >
                        <h2 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{t('dashboard.pastEmergencies')}</h2>
                        <div className="mt-4 space-y-6 relative pl-4 border-l-2 border-slate-100 dark:border-slate-700">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white dark:ring-slate-800"></div>
                                <p className="text-sm text-slate-500 mb-1">Dec 10, 2024</p>
                                <p className={clsx("font-semibold", isDarkMode ? "text-slate-200" : "text-slate-800")}>Severe Allergic Reaction</p>
                                <p className="text-xs text-slate-500">St. Mary's Hospital • Discharged</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full ring-4 ring-white dark:ring-slate-800"></div>
                                <p className="text-sm text-slate-500 mb-1">Nov 05, 2024</p>
                                <p className={clsx("font-semibold", isDarkMode ? "text-slate-200" : "text-slate-800")}>Routine Checkup</p>
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
