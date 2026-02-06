import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X } from 'lucide-react';
import api from '../utils/api';

const SOSButton = () => {
    const [isActive, setIsActive] = useState(false);
    const [count, setCount] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (isActive && count > 0) {
            timer = setTimeout(() => setCount(count - 1), 1000);
        } else if (isActive && count === 0) {
            triggerSOS();
        }
        return () => clearTimeout(timer);
    }, [isActive, count]);

    const handlePress = () => {
        setIsActive(true);
        setCount(5);
    };

    const handleCancel = () => {
        setIsActive(false);
        setCount(5);
    };

    const triggerSOS = async () => {
        setIsActive(false);
        try {
            // Mock location for MVP
            const location = { lat: 37.7749, lng: -122.4194, address: "123 Main St, Tech City" };
            await api.post('/emergency', { location, severity: 'Critical' });
            navigate('/emergency');
        } catch (err) {
            console.error("SOS Trigger Failed", err);
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
                        className="fixed inset-0 bg-red-600/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white"
                    >
                        <h1 className="text-4xl font-black mb-4 animate-pulse">EMERGENCY SOS</h1>
                        <div className="text-9xl font-bold mb-8">{count}</div>
                        <p className="text-xl mb-12 font-medium">Sending alert to nearby responders...</p>

                        <button
                            onClick={handleCancel}
                            className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-xl flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <X className="w-6 h-6" /> CANCEL ALERT
                        </button>
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
