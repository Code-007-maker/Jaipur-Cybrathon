import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
    Upload, FileText, Trash2, Eye, X, AlertCircle, CheckCircle,
    FileImage, File, Pill, Heart, Activity, Folder, Star,
    Sparkles, RefreshCw, ExternalLink, Shield
} from 'lucide-react';
import clsx from 'clsx';
import api from '../utils/api';

const ReportVault = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const fileInputRef = useRef(null);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [filter, setFilter] = useState('all');
    const [dragOver, setDragOver] = useState(false);

    // Form state for upload
    const [uploadForm, setUploadForm] = useState({
        title: '',
        category: 'other',
        isEmergencyRelevant: false
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const categories = [
        { value: 'all', label: 'All Reports', icon: Folder },
        { value: 'blood_test', label: 'Blood Tests', icon: Activity },
        { value: 'imaging', label: 'Imaging/Scans', icon: FileImage },
        { value: 'prescription', label: 'Prescriptions', icon: Pill },
        { value: 'discharge', label: 'Discharge', icon: FileText },
        { value: 'ecg', label: 'ECG/Heart', icon: Heart },
        { value: 'other', label: 'Other', icon: File }
    ];

    const categoryIcons = {
        blood_test: Activity,
        imaging: FileImage,
        prescription: Pill,
        discharge: FileText,
        ecg: Heart,
        other: File
    };

    const categoryColors = {
        blood_test: 'text-red-500 bg-red-100 dark:bg-red-900/30',
        imaging: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
        prescription: 'text-green-500 bg-green-100 dark:bg-green-900/30',
        discharge: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
        ecg: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
        other: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30'
    };

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reports${filter !== 'all' ? `?category=${filter}` : ''}`);
            setReports(res.data);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Only PDF, JPG, and PNG files are allowed.');
            return;
        }

        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit.');
            return;
        }

        setSelectedFile(file);
        // Auto-set title from filename
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadForm(prev => ({ ...prev, title: nameWithoutExt }));
        setShowUploadModal(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadForm.title.trim()) {
            alert('Please provide a title for your report');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', uploadForm.title);
            formData.append('category', uploadForm.category);
            formData.append('isEmergencyRelevant', uploadForm.isEmergencyRelevant);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const res = await api.post('/reports/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Add new report to list
            setReports(prev => [res.data.report, ...prev]);

            // Reset form
            setTimeout(() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadForm({ title: '', category: 'other', isEmergencyRelevant: false });
                setUploadProgress(0);
            }, 500);

        } catch (err) {
            console.error('Upload error:', err);
            alert(err.response?.data?.msg || 'Failed to upload report');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/reports/${reportId}`);
            setReports(prev => prev.filter(r => r._id !== reportId));
            if (selectedReport?._id === reportId) {
                setSelectedReport(null);
                setShowPreview(false);
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete report');
        }
    };

    const toggleEmergencyRelevant = async (reportId) => {
        try {
            const res = await api.patch(`/reports/${reportId}/emergency`);
            setReports(prev => prev.map(r =>
                r._id === reportId ? { ...r, isEmergencyRelevant: res.data.isEmergencyRelevant } : r
            ));
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const triggerReanalysis = async (reportId) => {
        try {
            const res = await api.post(`/reports/${reportId}/analyze`);
            setReports(prev => prev.map(r =>
                r._id === reportId ? { ...r, aiSummary: res.data.aiSummary } : r
            ));
            if (selectedReport?._id === reportId) {
                setSelectedReport(prev => ({ ...prev, aiSummary: res.data.aiSummary }));
            }
        } catch (err) {
            console.error('Reanalysis error:', err);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={clsx("text-3xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>
                        Health Report Vault
                    </h1>
                    <p className="text-slate-500">Securely store and access your medical reports anytime</p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                    <Upload className="w-5 h-5" />
                    Upload Report
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </header>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.value}
                            onClick={() => setFilter(cat.value)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all",
                                filter === cat.value
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                    : isDarkMode
                                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Drag & Drop Zone (when empty or always visible) */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={clsx(
                    "border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer",
                    dragOver
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : isDarkMode
                            ? "border-slate-700 hover:border-slate-600"
                            : "border-slate-300 hover:border-slate-400",
                    reports.length > 0 && "hidden md:block"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className={clsx(
                    "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                    isDarkMode ? "bg-slate-800" : "bg-slate-100"
                )}>
                    <Upload className={clsx("w-8 h-8", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                </div>
                <p className={clsx("font-semibold mb-1", isDarkMode ? "text-white" : "text-slate-900")}>
                    Drag & drop your medical reports here
                </p>
                <p className="text-sm text-slate-500">or click to browse • PDF, JPG, PNG up to 10MB</p>
            </div>

            {/* Reports Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className={clsx("w-16 h-16 mx-auto mb-4", isDarkMode ? "text-slate-600" : "text-slate-300")} />
                    <h3 className={clsx("text-xl font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>
                        No reports yet
                    </h3>
                    <p className="text-slate-500">Upload your first medical report to get started</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {reports.map((report) => {
                            const CategoryIcon = categoryIcons[report.category] || File;
                            return (
                                <motion.div
                                    key={report._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={clsx(
                                        "rounded-2xl p-5 border transition-all hover:shadow-lg cursor-pointer group",
                                        isDarkMode
                                            ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                                            : "bg-white border-slate-200 hover:border-slate-300"
                                    )}
                                    onClick={() => { setSelectedReport(report); setShowPreview(true); }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={clsx("p-2.5 rounded-xl", categoryColors[report.category])}>
                                            <CategoryIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {report.isEmergencyRelevant && (
                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <Shield className="w-3 h-3" /> Emergency
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title & Category */}
                                    <h3 className={clsx(
                                        "font-bold text-lg mb-1 line-clamp-2",
                                        isDarkMode ? "text-white" : "text-slate-900"
                                    )}>
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-3">
                                        {report.categoryLabel} • {formatDate(report.uploadedAt)}
                                    </p>

                                    {/* AI Summary Preview */}
                                    {report.aiSummary && (
                                        <div className={clsx(
                                            "p-3 rounded-xl mb-3 text-sm",
                                            isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
                                        )}>
                                            <div className="flex items-center gap-1.5 mb-1.5 text-blue-600">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span className="font-semibold text-xs">AI Summary</span>
                                            </div>
                                            <p className={clsx(
                                                "text-xs line-clamp-2",
                                                isDarkMode ? "text-slate-300" : "text-slate-600"
                                            )}>
                                                {report.aiSummary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.open(report.fileUrl, '_blank'); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" /> View
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleEmergencyRelevant(report._id); }}
                                            className={clsx(
                                                "p-2 rounded-lg transition-colors",
                                                report.isEmergencyRelevant
                                                    ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                                                    : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            )}
                                            title="Toggle Emergency Access"
                                        >
                                            <Star className={clsx("w-4 h-4", report.isEmergencyRelevant && "fill-current")} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(report._id); }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !uploading && setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={clsx(
                                "w-full max-w-md rounded-3xl p-6 shadow-2xl",
                                isDarkMode ? "bg-slate-800" : "bg-white"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={clsx("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>
                                    Upload Report
                                </h2>
                                {!uploading && (
                                    <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Selected File Preview */}
                            <div className={clsx(
                                "p-4 rounded-xl mb-4 flex items-center gap-3",
                                isDarkMode ? "bg-slate-700" : "bg-slate-100"
                            )}>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={clsx("font-medium truncate", isDarkMode ? "text-white" : "text-slate-900")}>
                                        {selectedFile?.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className={clsx("block text-sm font-medium mb-1.5", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        Report Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Blood Test - January 2026"
                                        className={clsx(
                                            "w-full px-4 py-2.5 rounded-xl border transition-colors",
                                            isDarkMode
                                                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                                : "bg-white border-slate-300 text-slate-900"
                                        )}
                                    />
                                </div>

                                <div>
                                    <label className={clsx("block text-sm font-medium mb-1.5", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                        Category
                                    </label>
                                    <select
                                        value={uploadForm.category}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                                        className={clsx(
                                            "w-full px-4 py-2.5 rounded-xl border transition-colors",
                                            isDarkMode
                                                ? "bg-slate-700 border-slate-600 text-white"
                                                : "bg-white border-slate-300 text-slate-900"
                                        )}
                                    >
                                        {categories.filter(c => c.value !== 'all').map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <label className={clsx(
                                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                                    uploadForm.isEmergencyRelevant
                                        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                                        : isDarkMode
                                            ? "border-slate-700 hover:border-slate-600"
                                            : "border-slate-200 hover:border-slate-300"
                                )}>
                                    <input
                                        type="checkbox"
                                        checked={uploadForm.isEmergencyRelevant}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, isEmergencyRelevant: e.target.checked }))}
                                        className="w-5 h-5 rounded text-red-600"
                                    />
                                    <div>
                                        <p className={clsx("font-medium", isDarkMode ? "text-white" : "text-slate-900")}>
                                            Emergency Relevant
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Make available to emergency responders
                                        </p>
                                    </div>
                                    <Shield className={clsx(
                                        "w-5 h-5 ml-auto",
                                        uploadForm.isEmergencyRelevant ? "text-red-500" : "text-slate-400"
                                    )} />
                                </label>
                            </div>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="mt-4">
                                    <div className={clsx(
                                        "h-2 rounded-full overflow-hidden",
                                        isDarkMode ? "bg-slate-700" : "bg-slate-200"
                                    )}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            className="h-full bg-blue-600 rounded-full"
                                        />
                                    </div>
                                    <p className="text-sm text-center mt-2 text-slate-500">
                                        {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                    className={clsx(
                                        "flex-1 py-3 rounded-xl font-medium transition-colors",
                                        isDarkMode
                                            ? "bg-slate-700 text-white hover:bg-slate-600"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !uploadForm.title.trim()}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={clsx(
                                "w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl",
                                isDarkMode ? "bg-slate-800" : "bg-white"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className={clsx("text-2xl font-bold mb-1", isDarkMode ? "text-white" : "text-slate-900")}>
                                        {selectedReport.title}
                                    </h2>
                                    <p className="text-slate-500">
                                        {selectedReport.categoryLabel} • Uploaded {formatDate(selectedReport.uploadedAt)}
                                    </p>
                                </div>
                                <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Emergency Badge */}
                            {selectedReport.isEmergencyRelevant && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 dark:text-red-400 font-medium text-sm">
                                        This report is accessible during emergencies
                                    </span>
                                </div>
                            )}

                            {/* AI Summary */}
                            {selectedReport.aiSummary && (
                                <div className={clsx(
                                    "p-4 rounded-2xl mb-6 border",
                                    isDarkMode
                                        ? "bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800/50"
                                        : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Sparkles className="w-5 h-5" />
                                            <span className="font-bold">AI-Assisted Understanding</span>
                                        </div>
                                        <button
                                            onClick={() => triggerReanalysis(selectedReport._id)}
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Reanalyze
                                        </button>
                                    </div>
                                    <p className={clsx(
                                        "text-sm leading-relaxed",
                                        isDarkMode ? "text-slate-300" : "text-slate-700"
                                    )}>
                                        {selectedReport.aiSummary}
                                    </p>
                                    <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        AI-assisted understanding only. Not a medical diagnosis.
                                    </p>
                                </div>
                            )}

                            {/* File Preview / Actions */}
                            <div className={clsx(
                                "p-4 rounded-xl mb-6",
                                isDarkMode ? "bg-slate-700" : "bg-slate-100"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("p-3 rounded-xl", categoryColors[selectedReport.category])}>
                                            {(() => { const Icon = categoryIcons[selectedReport.category]; return <Icon className="w-6 h-6" />; })()}
                                        </div>
                                        <div>
                                            <p className={clsx("font-medium", isDarkMode ? "text-white" : "text-slate-900")}>
                                                {selectedReport.fileType.toUpperCase()} Document
                                            </p>
                                            <p className="text-sm text-slate-500">Click to view full document</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(selectedReport.fileUrl, '_blank')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => toggleEmergencyRelevant(selectedReport._id)}
                                    className={clsx(
                                        "flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                                        selectedReport.isEmergencyRelevant
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            : isDarkMode
                                                ? "bg-slate-700 text-white hover:bg-slate-600"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                >
                                    <Star className={clsx("w-4 h-4", selectedReport.isEmergencyRelevant && "fill-current")} />
                                    {selectedReport.isEmergencyRelevant ? 'Remove from Emergency' : 'Add to Emergency'}
                                </button>
                                <button
                                    onClick={() => { handleDelete(selectedReport._id); }}
                                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReportVault;
