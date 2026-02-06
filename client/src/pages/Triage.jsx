import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Check, AlertTriangle, Thermometer, Wind, Heart, ChevronRight, Loader2 } from 'lucide-react';
import api from '../utils/api';

const Triage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [symptoms, setSymptoms] = useState('');
    const [selectedCommon, setSelectedCommon] = useState([]);
    const [vitals, setVitals] = useState({ heartRate: '', temperature: '', oxygen: '' });
    const [result, setResult] = useState(null);

    const commonSymptoms = [
        "Headache", "Fever", "Cough", "Chest Pain", "Dizziness",
        "Nausea", "Stomach Pain", "Shortness of Breath"
    ];

    const toggleSymptom = (sym) => {
        if (selectedCommon.includes(sym)) {
            setSelectedCommon(selectedCommon.filter(s => s !== sym));
        } else {
            setSelectedCommon([...selectedCommon, sym]);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const combinedSymptoms = [...selectedCommon, symptoms].join(', ');
            const res = await api.post('/triage/analyze', {
                symptoms: combinedSymptoms,
                vitals
            });
            setResult(res.data);
            setStep(3);
        } catch (err) {
            console.error(err);
            // Handle error state
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (sev) => {
        switch (sev?.toLowerCase()) {
            case 'critical': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-green-500 text-white';
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">AI Health Assessment</h1>
                <p className="text-slate-500">Tell us what you're feeling for an instant triage.</p>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Analyzing Symptoms...</h3>
                    <p className="text-slate-500">Consulting AI Medical Engine</p>
                </div>
            ) : step === 3 && result ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className={`p-6 rounded-3xl ${getSeverityColor(result.severity)} shadow-lg`}>
                        <div className="flex items-center gap-4 mb-4">
                            <AlertTriangle className="w-10 h-10" />
                            <div>
                                <p className="font-bold opacity-80">Risk Level</p>
                                <h2 className="text-4xl font-bold uppercase tracking-wide">{result.severity}</h2>
                            </div>
                        </div>
                        <p className="text-lg font-medium opacity-90">{result.recommendedAction}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Possible Causes</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {result.possibleCauses?.map((cause, i) => (
                                <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full font-medium">
                                    {cause}
                                </span>
                            ))}
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-3">
                            <Activity className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <p className="font-bold text-blue-800">AI Confidence: {result.confidence}%</p>
                                <p className="text-sm text-blue-600">This is an automated assessment, not a doctor's diagnosis.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Start New Assessment
                    </button>
                </motion.div>
            ) : (
                <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
                    {step === 1 ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div>
                                <label className="block text-lg font-bold text-slate-900 mb-4">Common Symptoms</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {commonSymptoms.map(sym => (
                                        <button
                                            key={sym}
                                            onClick={() => toggleSymptom(sym)}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${selectedCommon.includes(sym)
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            {sym}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-lg font-bold text-slate-900 mb-2">Anything else?</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                    placeholder="Describe specifically where it hurts or how you feel..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!symptoms && selectedCommon.length === 0}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                Next Step <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900">Add Vitals (Optional)</h2>
                            <p className="text-slate-500">Helping the AI be more accurate.</p>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-500" /> Heart Rate (BPM)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200"
                                        placeholder="e.g 80"
                                        value={vitals.heartRate}
                                        onChange={e => setVitals({ ...vitals, heartRate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-orange-500" /> Temperature (°F)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200"
                                        placeholder="e.g 98.6"
                                        value={vitals.temperature}
                                        onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Wind className="w-4 h-4 text-blue-500" /> SpO2 (%)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200"
                                        placeholder="e.g 98"
                                        value={vitals.oxygen}
                                        onChange={e => setVitals({ ...vitals, oxygen: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Analyze Symptoms
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Triage;
