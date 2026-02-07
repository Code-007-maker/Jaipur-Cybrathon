import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

const SOSButton = () => {
    const { t } = useTranslation();
    const [isActive, setIsActive] = useState(false);
    const [count, setCount] = useState(5);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (isActive && count > 0 && !isSending) {
            timer = setTimeout(() => setCount(count - 1), 1000);
        } else if (isActive && count === 0 && !isSending) {
            triggerSOS();
        }
        return () => clearTimeout(timer);
    }, [isActive, count, isSending]);

    const handlePress = () => {
        setIsActive(true);
        setCount(5);
        setIsSending(false);
    };

    const handleCancel = () => {
        setIsActive(false);
        setCount(5);
        setIsSending(false);
    };

    const triggerSOS = async () => {
        setIsSending(true);
        try {
            let location = { lat: 0, lng: 0, address: "Unknown Location" };

            // Function to post SOS and navigate
            const performSOS = async (loc) => {
                try {
                    // Try to get recent triage context for Decision Trace
                    const lastTriage = sessionStorage.getItem('lastTriageResult');
                    const triageData = lastTriage ? JSON.parse(lastTriage) : null;

                    await api.post('/emergency', {
                        location: loc,
                        severity: triageData?.severity || 'Critical',
                        triageData: triageData
                    });

                    // Clear after SOS
                    sessionStorage.removeItem('lastTriageResult');

                    setIsActive(false);
                    setIsSending(false);
                    navigate('/emergency');
                } catch (err) {
                    console.error("API Error", err);
                    setIsActive(false);
                    setIsSending(false);
                    navigate('/emergency'); // Navigate anyway, page will try to recover
                }
            };

            // Try Geolocation with 3s timeout
            if ("geolocation" in navigator) {
                const geoOptions = { timeout: 3000, enableHighAccuracy: true };

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        location = { lat: latitude, lng: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };

                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                            const data = await response.json();
                            location.address = data.display_name;
                        } catch (e) {
                            console.error("Geocoding error", e);
                        }

                        await performSOS(location);
                    },
                    async (error) => {
                        console.error("Geo Error", error);
                        await performSOS(location);
                    },
                    geoOptions
                );
            } else {
                await performSOS(location);
            }
        } catch (err) {
            console.error("SOS Trigger Failed", err);
            setIsSending(false);
            setIsActive(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-red-600/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6 text-center"
                    >
                        <h1 className="text-4xl font-black mb-4 animate-pulse">
                            {isSending ? t('sos.activating') : t('sos.confirmTitle')}
                        </h1>

                        {!isSending ? (
                            <div className="text-9xl font-bold mb-8">{count}</div>
                        ) : (
                            <div className="mb-8">
                                <Loader2 className="w-24 h-24 animate-spin mx-auto opacity-50" />
                            </div>
                        )}

                        <p className="text-xl mb-12 font-medium max-w-md">
                            {isSending
                                ? t('sos.active')
                                : t('sos.confirmMessage')}
                        </p>

                        {!isSending && (
                            <button
                                onClick={handleCancel}
                                className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-xl flex items-center gap-2 hover:scale-105 transition-transform"
                            >
                                <X className="w-6 h-6" /> {t('sos.cancel')}
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePress}
                className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-red-600 text-white w-16 h-16 lg:w-20 lg:h-20 rounded-full shadow-lg shadow-red-400/50 flex items-center justify-center z-40 border-4 border-white ring-4 ring-red-100"
            >
                <Phone className="w-8 h-8 fill-current" />
            </motion.button>
        </>
    );
};

export default SOSButton;
