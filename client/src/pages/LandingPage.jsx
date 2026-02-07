import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, ShieldCheck, Heart, User, ArrowRight,
    Stethoscope, Clock, CheckCircle, Menu, X, Phone,
    Calendar, Database, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import aiVideo from '../assets/AI.mp4';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 w-full">
            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-600 p-2 rounded-lg text-white">
                            <Activity size={24} />
                        </div>
                        <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                            CareGrid<span className="text-primary-600">AI</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
                        <button onClick={() => scrollToSection('features')} className="hover:text-primary-600 transition-colors">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="hover:text-primary-600 transition-colors">How it Works</button>
                        <button onClick={() => scrollToSection('testimonials')} className="hover:text-primary-600 transition-colors">Testimonials</button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary-200 transition-all hover:shadow-primary-300 font-semibold"
                        >
                            Portal Login
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-lg overflow-hidden"
                        >
                            <div className="flex flex-col p-6 gap-4 font-medium text-slate-600">
                                <button onClick={() => scrollToSection('features')} className="text-left py-2">Features</button>
                                <button onClick={() => scrollToSection('how-it-works')} className="text-left py-2">How it Works</button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-primary-600 text-white py-3 rounded-lg text-center font-bold"
                                >
                                    Login
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section - Full Screen with Background */}
            <header id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80"
                        alt="Modern Hospital"
                        className="w-full h-full object-cover"
                    />
                    {/* Light overlay instead of dark */}
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-slate-900">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="lg:w-1/2 max-w-3xl"
                        >
                            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full text-sm font-medium mb-8 text-primary-700 shadow-sm">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                </span>
                                Smart AI Based Health Record & Emergency Management System
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 tracking-tight text-slate-900">
                                Delivering Superior <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">
                                    Patient Care
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-700 mb-10 leading-relaxed font-light max-w-2xl">
                                An integrated platform for real-time triage, seamless patient records, and efficient hospital administration.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary-200/50 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-3"
                                >
                                    Access Portal
                                    <ArrowRight size={20} />
                                </button>
                                <button className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-sm hover:border-slate-300">
                                    Request Demo
                                </button>
                            </div>

                            <div className="mt-12 flex items-center gap-8 text-sm font-medium text-slate-600">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                                            <img src={`https://i.pravatar.cc/150?img=${i + 30}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-900 text-lg font-bold">2,500+</span>
                                    <span>Medical Professionals Trusted</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Side Video */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="lg:w-1/2 w-full relative z-10"
                        >
                            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm relative group">
                                <div className="absolute inset-0 bg-primary-900/10 group-hover:bg-transparent transition-colors duration-300 z-10 pointer-events-none" />
                                <video
                                    src={aiVideo}
                                    autoPlay
                                    loop
                                    speed={0.7}
                                    playsInline
                                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-slate-400 animate-bounce"
                >
                    <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    </div>
                </motion.div>
            </header>

            {/* Features Section - Clean & Professional */}
            <section id="features" className="py-32 bg-slate-50 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-24">
                        <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-3">Core Capabilities</h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Designed for Modern Healthcare</h3>
                        <p className="text-xl text-slate-600 font-light">
                            Streamline your workflow with tools built specifically for high-performance medical teams.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            {
                                title: "AI-Powered Triage",
                                desc: "Automated prioritization algorithms to ensure critical cases receive immediate attention.",
                                icon: Activity,
                                color: "text-blue-600",
                                bg: "bg-blue-50"
                            },
                            {
                                title: "Secure Patient Vault",
                                desc: "HIPAA-compliant encrypted storage for all sensitive medical records and history.",
                                icon: ShieldCheck,
                                color: "text-teal-600",
                                bg: "bg-teal-50"
                            },
                            {
                                title: "Real-Time Vitals",
                                desc: "Seamless integration with IoT monitoring devices for instant patient telemetry.",
                                icon: Heart,
                                color: "text-rose-600",
                                bg: "bg-rose-50"
                            },
                            {
                                title: "Telemedicine Suite",
                                desc: "HD video consultation capabilities with integrated prescription management.",
                                icon: Phone,
                                color: "text-indigo-600",
                                bg: "bg-indigo-50"
                            },
                            {
                                title: "Smart Scheduling",
                                desc: "Intelligent resource allocation for doctors, rooms, and equipment.",
                                icon: Calendar,
                                color: "text-purple-600",
                                bg: "bg-purple-50"
                            },
                            {
                                title: "Role-Based Access",
                                desc: "Granular permission controls ensuring data security at every level.",
                                icon: Lock,
                                color: "text-slate-600",
                                bg: "bg-slate-100"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="group p-10 bg-white rounded-3xl border border-slate-100 hover:border-primary-100/50 shadow-sm hover:shadow-2xl hover:shadow-primary-900/5 transition-all duration-300"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h4>
                                <p className="text-lg text-slate-600 font-light leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Seamless Workflow for Medical Professionals</h2>
                            <p className="text-lg text-slate-600 mb-8">Reduce administrative burden and focus on what matters most: patient care.</p>

                            <div className="space-y-6">
                                {[
                                    { title: "Patient Registration", desc: "Quick digital Intake via QR code or manual entry." },
                                    { title: "Automated Triage", desc: "AI analyzes symptoms to assign urgency levels instantly." },
                                    { title: "Doctor Assignment", desc: "Smart routing to the appropriate specialist based on availability." },
                                    { title: "Digital Prescription", desc: "e-Prescriptions sent directly to pharmacy and patient app." }
                                ].map((step, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
                                            <p className="text-slate-600">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-teal-400 rounded-3xl transform rotate-3 scale-105 opacity-20"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Hospital Workflow"
                                    className="rounded-3xl shadow-lg relative z-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-primary-700 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: "50+", label: "Hospitals" },
                            { number: "10k+", label: "Patients Served" },
                            { number: "99.9%", label: "Uptime" },
                            { number: "24/7", label: "Support" }
                        ].map((stat, idx) => (
                            <div key={idx}>
                                <div className="text-4xl md:text-5xl font-black mb-2 text-primary-200">{stat.number}</div>
                                <div className="text-primary-100 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-16">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="bg-primary-600 p-2 rounded-lg text-white">
                                    <Activity size={24} />
                                </div>
                                <span className="text-2xl font-bold text-white">CareGrid AI</span>
                            </div>
                            <p className="text-slate-400 max-w-sm mb-6">
                                Pioneering the digital transformation of healthcare facilities worldwide. Secure, efficient, and intelligent.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Platform</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Doctors</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Integration</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Security</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Company</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} CareGrid AI. All rights reserved.</p>
                        <div className="flex gap-6">
                            {/* Social Icons Placeholder */}
                            <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                            <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                            <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
