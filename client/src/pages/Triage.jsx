import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Check, AlertTriangle, Thermometer, Wind, Heart, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

const Triage = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [symptoms, setSymptoms] = useState('');
    const [selectedCommon, setSelectedCommon] = useState([]);
    const [vitals, setVitals] = useState({ heartRate: '', temperature: '', oxygen: '' });
    const [result, setResult] = useState(null);

    const commonSymptoms = [
        { key: 'headache', label: t('triage.symptoms.headache') },
        { key: 'fever', label: t('triage.symptoms.fever') },
        { key: 'cough', label: t('triage.symptoms.cough') },
        { key: 'chestPain', label: t('triage.symptoms.chestPain') },
        { key: 'dizziness', label: t('triage.symptoms.dizziness') },
        { key: 'nausea', label: t('triage.symptoms.nausea') },
        { key: 'stomachPain', label: t('triage.symptoms.stomachPain') },
        { key: 'shortnessOfBreath', label: t('triage.symptoms.shortnessOfBreath') }
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
            case 'critical': return isDarkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white';
            case 'high': return isDarkMode ? 'bg-orange-700 text-white' : 'bg-orange-500 text-white';
            case 'medium': return isDarkMode ? 'bg-yellow-700 text-white' : 'bg-yellow-500 text-white';
            default: return isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white';
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">{t('triage.title')}</h1>
                <p className="text-slate-500">{t('triage.subtitle')}</p>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">{t('triage.analyzing')}</h3>
                    <p className="text-slate-500">{t('triage.consultingAI')}</p>
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
                                <p className="font-bold opacity-80">{t('triage.riskLevel')}</p>
                                <p className="font-bold opacity-80">{t('triage.riskLevel')}</p>
                                <h2 className="text-4xl font-bold uppercase tracking-wide">{result.severity}</h2>
                            </div>
                        </div>
                        <p className="text-lg font-medium opacity-90">{result.recommendedAction}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{t('triage.possibleCauses')}</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {result.possibleCauses?.map((cause, i) => (
                                <span key={i} className={clsx(
                                    "px-4 py-2 rounded-full font-medium",
                                    isDarkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
                                )}>
                                    {cause}
                                </span>
                            ))}
                        </div>

                        <div className={clsx(
                            "p-4 rounded-xl flex items-start gap-3",
                            isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                        )}>
                            <Activity className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <p className="font-bold text-blue-800">{t('triage.aiConfidence')}: {result.confidence}%</p>
                                <p className="text-sm text-blue-600">{t('triage.aiDisclaimer')}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        {t('triage.newAssessment')}
                    </button>
                </motion.div>
            ) : (
                <div className={clsx(
                    "p-6 lg:p-8 rounded-3xl shadow-sm border",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                )}>
                    {step === 1 ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div>
                                <label className="block text-lg font-bold text-slate-900 mb-4">{t('triage.commonSymptoms')}</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {commonSymptoms.map(sym => (
                                        <button
                                            key={sym.key}
                                            onClick={() => toggleSymptom(sym.label)}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${selectedCommon.includes(sym.label)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            {sym.label}
                                            {sym.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-lg font-bold text-slate-900 mb-2">{t('triage.anythingElse')}</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                    placeholder={t('triage.describePlaceholder')}
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!symptoms && selectedCommon.length === 0}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {t('triage.nextStep')} <ChevronRight className="w-5 h-5" />
                                {t('triage.nextStep')} <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900">{t('triage.addVitals')}</h2>
                            <p className="text-slate-500">{t('triage.vitalsHelp')}</p>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-500" /> {t('triage.heartRate')}
                                    </label>
                                    <input
                                        type="number"
                                        className={clsx(
                                            "w-full px-4 py-3 rounded-xl border",
                                            isDarkMode
                                                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                                : "bg-slate-50 border-slate-200 text-slate-900"
                                        )}
                                        placeholder="e.g 80"
                                        value={vitals.heartRate}
                                        onChange={e => setVitals({ ...vitals, heartRate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-orange-500" /> {t('triage.temperature')}
                                    </label>
                                    <input
                                        type="number"
                                        className={clsx(
                                            "w-full px-4 py-3 rounded-xl border",
                                            isDarkMode
                                                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                                : "bg-slate-50 border-slate-200 text-slate-900"
                                        )}
                                        placeholder="e.g 98.6"
                                        value={vitals.temperature}
                                        onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Wind className="w-4 h-4 text-blue-500" /> {t('triage.spo2')}
                                    </label>
                                    <input
                                        type="number"
                                        className={clsx(
                                            "w-full px-4 py-3 rounded-xl border",
                                            isDarkMode
                                                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                                : "bg-slate-50 border-slate-200 text-slate-900"
                                        )}
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
                                    {t('triage.back')}
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    className={clsx(
                                        "flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg",
                                        isDarkMode ? "shadow-blue-900/30" : "shadow-blue-200"
                                    )}
                                >
                                    {t('triage.analyzeSymptoms')}
                                    {t('triage.analyzeSymptoms')}
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
