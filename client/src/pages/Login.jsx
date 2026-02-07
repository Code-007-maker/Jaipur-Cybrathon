import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Activity, Loader2, Mail, Lock, User, UserCheck, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const Login = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [loginMode, setLoginMode] = useState('patient'); // 'patient' or 'doctor'
    const [step, setStep] = useState(1); // 1 = Details, 2 = OTP (for doctor)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        doctorName: '',
        doctorEmail: '',
        patientEmail: '',
        otp: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, initDoctorLogin, verifyDoctorOTP } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (loginMode === 'patient') {
                await login({ email: formData.email, password: formData.password });
                navigate('/');
            } else {
                // Doctor Login
                if (step === 1) {
                    await initDoctorLogin({
                        doctorName: formData.doctorName,
                        doctorEmail: formData.doctorEmail,
                        patientEmail: formData.patientEmail
                    });
                    setStep(2);
                } else {
                    await verifyDoctorOTP({
                        doctorEmail: formData.doctorEmail,
                        patientEmail: formData.patientEmail,
                        otp: formData.otp
                    });
                    navigate('/');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.msg || err.message || t('login.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={clsx(
            "fixed inset-0 flex items-center justify-center p-6 overflow-hidden transition-colors duration-500",
            isDarkMode ? "bg-slate-950" : "bg-slate-50"
        )}>
            {/* Immersive Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={clsx(
                        "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-40",
                        isDarkMode ? "bg-blue-600" : "bg-blue-200"
                    )}
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -50, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className={clsx(
                        "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-40",
                        isDarkMode ? "bg-indigo-600" : "bg-indigo-200"
                    )}
                />
                {loginMode === 'doctor' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full blur-[100px] bg-emerald-500"
                    />
                )}
            </div>

            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={clsx(
                    "w-full max-w-lg backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border relative z-10 transition-all duration-500",
                    isDarkMode
                        ? "bg-slate-900/40 border-slate-700/50"
                        : "bg-white/60 border-white/50"
                )}
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        layout
                        className={clsx(
                            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative group",
                            loginMode === 'patient' ? "bg-blue-600" : "bg-emerald-600"
                        )}
                    >
                        {loginMode === 'patient' ? (
                            <Activity className="text-white w-12 h-12" />
                        ) : (
                            <ShieldCheck className="text-white w-12 h-12" />
                        )}
                        <div className="absolute inset-0 rounded-3xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                    <motion.h1
                        layout
                        className={clsx(
                            "text-4xl font-black mb-3 tracking-tight",
                            isDarkMode ? "text-white" : "text-slate-900"
                        )}
                    >
                        {loginMode === 'patient' ? t('login.title') : 'Doctor Access'}
                    </motion.h1>
                    <p className={clsx(
                        "text-lg",
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                    )}>
                        {loginMode === 'patient' ? t('login.subtitle') : 'Secure Patient Data Access'}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className={clsx(
                    "flex p-1.5 rounded-2xl mb-8 border",
                    isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-200/50 border-slate-200"
                )}>
                    <button
                        onClick={() => { setLoginMode('patient'); setStep(1); setError(''); }}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300",
                            loginMode === 'patient'
                                ? "bg-blue-600 text-white shadow-lg"
                                : isDarkMode ? "text-slate-400" : "text-slate-600"
                        )}
                    >
                        <User className="w-4 h-4" /> Patient
                    </button>
                    <button
                        onClick={() => { setLoginMode('doctor'); setStep(1); setError(''); }}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300",
                            loginMode === 'doctor'
                                ? "bg-emerald-600 text-white shadow-lg"
                                : isDarkMode ? "text-slate-400" : "text-slate-600"
                        )}
                    >
                        <UserCheck className="w-4 h-4" /> Doctor
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={clsx(
                                "overflow-hidden p-4 rounded-2xl mb-6 text-sm flex items-center justify-center font-bold border",
                                isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-600"
                            )}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatePresence mode="wait">
                        {loginMode === 'patient' ? (
                            <motion.div
                                key="patient-inputs"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        {t('login.email')}
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder={t('login.emailPlaceholder')}
                                            className={clsx(
                                                "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                                isDarkMode
                                                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                                                    : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:shadow-xl focus:shadow-blue-100"
                                            )}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        {t('login.password')}
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className={clsx(
                                                "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                                isDarkMode
                                                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                                                    : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:shadow-xl focus:shadow-blue-100"
                                            )}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ) : step === 1 ? (
                            <motion.div
                                key="doctor-step-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        Doctor Full Name
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Dr. John Doe"
                                            className={clsx(
                                                "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                                isDarkMode
                                                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-slate-800"
                                                    : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-100"
                                            )}
                                            value={formData.doctorName}
                                            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        Doctor Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="doctor@example.com"
                                            className={clsx(
                                                "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                                isDarkMode
                                                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-slate-800"
                                                    : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-100"
                                            )}
                                            value={formData.doctorEmail}
                                            onChange={(e) => setFormData({ ...formData, doctorEmail: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        Patient Email (Authorized)
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="patient@example.com"
                                            className={clsx(
                                                "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none",
                                                isDarkMode
                                                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-slate-800"
                                                    : "bg-white border-slate-100 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-100"
                                            )}
                                            value={formData.patientEmail}
                                            onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="doctor-step-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6 text-center"
                            >
                                <div className={clsx(
                                    "p-4 rounded-3xl mb-4",
                                    isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                                )}>
                                    A verification code has been sent to <strong>{formData.patientEmail}</strong>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className={clsx("text-sm font-bold ml-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        Verification Code (OTP)
                                    </label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            maxLength="6"
                                            placeholder="000000"
                                            className={clsx(
                                                "w-full pl-12 pr-4 py-5 rounded-2xl border-2 text-2xl tracking-[1rem] font-black transition-all outline-none",
                                                isDarkMode
                                                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-700 focus:border-emerald-500 focus:bg-slate-800"
                                                    : "bg-white border-slate-100 text-slate-900 placeholder-slate-200 focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-100"
                                            )}
                                            value={formData.otp}
                                            onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm font-bold text-emerald-600 hover:underline"
                                >
                                    Change email details
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                            "w-full font-black py-5 rounded-[1.5rem] transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg",
                            loginMode === 'patient'
                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                {loginMode === 'patient' ? t('login.signIn') : (step === 1 ? 'Send OTP' : 'Authorize Access')}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                {loginMode === 'patient' && (
                    <div className="mt-10 text-center">
                        <p className={clsx(
                            "font-medium",
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                        )}>
                            {t('login.noAccount')}{" "}
                            <Link to="/register" className="text-blue-500 font-bold hover:text-blue-600 transition-colors">
                                {t('login.createId')}
                            </Link>
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
