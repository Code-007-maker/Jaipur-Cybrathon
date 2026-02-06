const cloudinary = require('cloudinary').v2;
const HealthReport = require('../models/HealthReport');
const OpenAI = require('openai');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize OpenAI (using existing config pattern from codebase)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Category labels for display
const categoryLabels = {
    blood_test: 'Blood Test',
    imaging: 'Imaging/Scan',
    prescription: 'Prescription',
    discharge: 'Discharge Summary',
    ecg: 'ECG/Heart',
    other: 'Other'
};

/**
 * Upload a health report
 */
exports.uploadReport = async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('File:', req.file);
        console.log('Body:', req.body);

        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const { title, category, isEmergencyRelevant } = req.body;

        if (!title) {
            return res.status(400).json({ msg: 'Title is required' });
        }

        // Get file type from mimetype
        const mimeToType = {
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png'
        };
        const fileType = mimeToType[req.file.mimetype] || 'other';

        // multer-storage-cloudinary provides:
        // - req.file.path: the Cloudinary URL
        // - req.file.filename: the public_id
        const fileUrl = req.file.path;
        const publicId = req.file.filename;

        console.log('File URL:', fileUrl);
        console.log('Public ID:', publicId);

        // Create report record
        const report = new HealthReport({
            userId: req.user.id,
            title,
            category: category || 'other',
            fileUrl: fileUrl,
            publicId: publicId,
            fileType,
            isEmergencyRelevant: isEmergencyRelevant === 'true' || isEmergencyRelevant === true
        });

        await report.save();
        console.log('Report saved:', report._id);

        // Trigger AI analysis in background (non-blocking)
        analyzeReportWithAI(report._id).catch(err => {
            console.error('AI Analysis Error:', err.message);
        });

        res.status(201).json({
            msg: 'Report uploaded successfully',
            report: {
                ...report.toObject(),
                categoryLabel: categoryLabels[report.category]
            }
        });

    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ msg: 'Server error during upload', error: err.message });
    }
};

/**
 * Get all reports for the current user
 */
exports.getReports = async (req, res) => {
    try {
        const { category, limit = 50 } = req.query;

        const query = { userId: req.user.id };
        if (category && category !== 'all') {
            query.category = category;
        }

        const reports = await HealthReport.find(query)
            .sort({ uploadedAt: -1 })
            .limit(parseInt(limit));

        // Add category labels
        const reportsWithLabels = reports.map(r => ({
            ...r.toObject(),
            categoryLabel: categoryLabels[r.category]
        }));

        res.json(reportsWithLabels);

    } catch (err) {
        console.error('Get Reports Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Get a single report by ID
 */
exports.getReport = async (req, res) => {
    try {
        const report = await HealthReport.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        res.json({
            ...report.toObject(),
            categoryLabel: categoryLabels[report.category]
        });

    } catch (err) {
        console.error('Get Report Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Delete a report
 */
exports.deleteReport = async (req, res) => {
    try {
        const report = await HealthReport.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        // Delete from Cloudinary
        try {
            const resourceType = report.fileType === 'pdf' ? 'raw' : 'image';
            await cloudinary.uploader.destroy(report.publicId, { resource_type: resourceType });
        } catch (cloudErr) {
            console.error('Cloudinary delete error:', cloudErr.message);
            // Continue with DB deletion even if Cloudinary fails
        }

        // Delete from database
        await HealthReport.deleteOne({ _id: report._id });

        res.json({ msg: 'Report deleted successfully' });

    } catch (err) {
        console.error('Delete Report Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Get emergency-relevant reports for a user
 */
exports.getEmergencyReports = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        const reports = await HealthReport.find({
            userId,
            isEmergencyRelevant: true
        })
            .sort({ uploadedAt: -1 })
            .limit(10);

        const reportsWithLabels = reports.map(r => ({
            ...r.toObject(),
            categoryLabel: categoryLabels[r.category]
        }));

        res.json(reportsWithLabels);

    } catch (err) {
        console.error('Get Emergency Reports Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * Manually trigger AI analysis for a report
 */
exports.triggerAnalysis = async (req, res) => {
    try {
        const report = await HealthReport.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        // Run analysis
        const summary = await analyzeReportWithAI(report._id);

        res.json({
            msg: 'Analysis complete',
            aiSummary: summary
        });

    } catch (err) {
        console.error('Trigger Analysis Error:', err);
        res.status(500).json({ msg: 'Server error during analysis' });
    }
};

/**
 * Toggle emergency relevance
 */
exports.toggleEmergencyRelevant = async (req, res) => {
    try {
        const report = await HealthReport.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        report.isEmergencyRelevant = !report.isEmergencyRelevant;
        await report.save();

        res.json({
            msg: 'Updated successfully',
            isEmergencyRelevant: report.isEmergencyRelevant
        });

    } catch (err) {
        console.error('Toggle Emergency Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * AI Analysis Function (internal)
 */
async function analyzeReportWithAI(reportId) {
    try {
        const report = await HealthReport.findById(reportId);
        if (!report) return null;

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-mvp') {
            // Use mock analysis for MVP/demo
            const mockSummary = generateMockAnalysis(report.title, report.category);
            report.aiSummary = mockSummary;
            report.aiAnalyzedAt = new Date();
            await report.save();
            return mockSummary;
        }

        // Real OpenAI analysis
        const prompt = `You are a medical report assistant. Analyze the following medical report context and provide a brief, patient-friendly summary.

Report Title: ${report.title}
Category: ${categoryLabels[report.category]}
File Type: ${report.fileType.toUpperCase()}

Important guidelines:
1. Provide a simple, understandable summary (2-3 sentences max)
2. If relevant, mention any values that might need attention
3. DO NOT provide diagnosis or treatment recommendations
4. Always end with: "Please consult a healthcare professional for proper interpretation."

Generate a helpful summary:`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful medical report summarizer. Never diagnose or prescribe treatment.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.5
        });

        const summary = completion.choices[0]?.message?.content || 'Unable to generate summary at this time.';

        report.aiSummary = summary;
        report.aiAnalyzedAt = new Date();
        await report.save();

        return summary;

    } catch (err) {
        console.error('AI Analysis Internal Error:', err.message);

        // Save fallback message
        const report = await HealthReport.findById(reportId);
        if (report) {
            report.aiSummary = 'AI analysis is currently unavailable. Your report has been securely stored and can be accessed by healthcare providers during emergencies.';
            report.aiAnalyzedAt = new Date();
            await report.save();
        }

        return null;
    }
}

/**
 * Mock analysis for demo/MVP mode
 */
function generateMockAnalysis(title, category) {
    const analyses = {
        blood_test: `This blood test report "${title}" has been uploaded and securely stored. Blood tests typically measure various components like hemoglobin, white blood cells, and glucose levels. Please consult a healthcare professional for proper interpretation.`,
        imaging: `Your imaging report "${title}" has been added to your health vault. Imaging studies help doctors visualize internal structures. Please consult a healthcare professional for proper interpretation.`,
        prescription: `The prescription "${title}" has been stored in your health records. This document contains medication information prescribed by your doctor. Please consult a healthcare professional for proper interpretation.`,
        discharge: `Your discharge summary "${title}" from a recent hospital visit has been saved. This document contains important information about your treatment and follow-up care. Please consult a healthcare professional for proper interpretation.`,
        ecg: `ECG report "${title}" has been uploaded. ECG tests record the electrical activity of your heart. Please consult a healthcare professional for proper interpretation.`,
        other: `Your medical document "${title}" has been securely stored. This report is now accessible in emergencies. Please consult a healthcare professional for proper interpretation.`
    };

    return analyses[category] || analyses.other;
}
