const cloudinary = require('cloudinary').v2;
const HealthReport = require('../models/HealthReport');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const vision = require('@google-cloud/vision');
const axios = require('axios');
const pdfParse = require('pdf-parse');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Google Cloud Vision for OCR
const visionClient = new vision.ImageAnnotatorClient({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    projectId: process.env.GOOGLE_PROJECT_ID
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
 * AI Analysis Function - Uses Hugging Face for FREE vision analysis
 */
async function analyzeReportWithAI(reportId) {
    try {
        const report = await HealthReport.findById(reportId);
        if (!report) return null;

        console.log('Starting AI analysis for report:', report._id, 'Type:', report.fileType);

        let extractedText = '';

        // Step 1: Extract text from the file
        if (report.fileType === 'pdf') {
            let pdfBuffer = null;

            // Try text extraction first for text-based PDFs
            try {
                console.log('Downloading PDF from:', report.fileUrl);
                const response = await axios.get(report.fileUrl, { responseType: 'arraybuffer' });
                pdfBuffer = Buffer.from(response.data);
                const pdfData = await pdfParse(pdfBuffer);
                extractedText = pdfData.text.substring(0, 8000);
                console.log('Extracted PDF text length:', extractedText.length);
            } catch (pdfErr) {
                console.error('PDF extraction error:', pdfErr.message);
            }

            // If PDF text extraction failed or got minimal text, try OCR (for scanned PDFs)
            if ((!extractedText || extractedText.trim().length < 50) && pdfBuffer) {
                console.log('PDF text extraction minimal, trying Vision OCR...');
                try {
                    // Use batchAnnotateFiles for PDF content
                    const request = {
                        requests: [
                            {
                                inputConfig: {
                                    content: pdfBuffer,
                                    mimeType: 'application/pdf',
                                },
                                features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                                pages: [1, 2, 3] // Limit to first 3 pages
                            },
                        ],
                    };

                    const [result] = await visionClient.batchAnnotateFiles(request);
                    const responses = result.responses?.[0]?.responses || [];
                    extractedText = responses.map(r => r.fullTextAnnotation?.text || '').join('\n');

                    console.log('Vision OCR extracted text from PDF:', extractedText.length);
                } catch (visionErr) {
                    console.error('PDF Vision OCR error:', visionErr.message);
                }
            }
        } else {
            // For images: Use Google Cloud Vision OCR to extract ALL text
            try {
                console.log('Using Google Cloud Vision OCR for:', report.fileUrl);

                // Download image buffer for robust OCR (better than passing URL)
                const response = await axios.get(report.fileUrl, { responseType: 'arraybuffer' });
                const [result] = await visionClient.textDetection(Buffer.from(response.data));
                const detections = result.textAnnotations;

                if (detections && detections.length > 0) {
                    // The first annotation contains the entire extracted text
                    extractedText = detections[0].description || '';
                    console.log('Vision OCR extracted text length:', extractedText.length);
                    console.log('First 500 chars:', extractedText.substring(0, 500));
                }
            } catch (visionErr) {
                console.error('Vision OCR error:', visionErr.message);
            }
        }

        // Step 2: Analyze the extracted text locally (no external API needed)
        let summary = '';

        if (extractedText && extractedText.length > 20) {
            // Define medical reference ranges
            const referenceRanges = {
                'hemoglobin': { min: 12, max: 16, unit: 'g/dL', name: 'Hemoglobin' },
                'haemoglobin': { min: 12, max: 16, unit: 'g/dL', name: 'Hemoglobin' },
                'hb': { min: 12, max: 16, unit: 'g/dL', name: 'Hemoglobin' },
                'rbc': { min: 4.5, max: 5.5, unit: 'million/µL', name: 'RBC Count' },
                'wbc': { min: 4500, max: 11000, unit: '/µL', name: 'WBC Count' },
                'platelets': { min: 150000, max: 400000, unit: '/µL', name: 'Platelets' },
                'glucose': { min: 70, max: 100, unit: 'mg/dL', name: 'Glucose (Fasting)' },
                'fasting glucose': { min: 70, max: 100, unit: 'mg/dL', name: 'Fasting Glucose' },
                'cholesterol': { min: 0, max: 200, unit: 'mg/dL', name: 'Total Cholesterol' },
                'total cholesterol': { min: 0, max: 200, unit: 'mg/dL', name: 'Total Cholesterol' },
                'triglycerides': { min: 0, max: 150, unit: 'mg/dL', name: 'Triglycerides' },
                'creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL', name: 'Creatinine' },
                'urea': { min: 7, max: 20, unit: 'mg/dL', name: 'Blood Urea' },
                'bun': { min: 7, max: 20, unit: 'mg/dL', name: 'BUN' },
                'hba1c': { min: 0, max: 5.7, unit: '%', name: 'HbA1c' },
                'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L', name: 'TSH' },
                'ldl': { min: 0, max: 100, unit: 'mg/dL', name: 'LDL Cholesterol' },
                'hdl': { min: 40, max: 200, unit: 'mg/dL', name: 'HDL Cholesterol' },
                'sgpt': { min: 7, max: 56, unit: 'U/L', name: 'SGPT (ALT)' },
                'sgot': { min: 10, max: 40, unit: 'U/L', name: 'SGOT (AST)' },
                'bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dL', name: 'Bilirubin' }
            };

            // Extract values from text using regex patterns
            const findings = [];
            const abnormalValues = [];
            const textLower = extractedText.toLowerCase();

            for (const [key, range] of Object.entries(referenceRanges)) {
                // Pattern to match: test_name followed by a number
                const patterns = [
                    new RegExp(`${key}[:\\s]+([\\d.]+)`, 'i'),
                    new RegExp(`${key}.*?([\\d.]+)\\s*${range.unit}`, 'i'),
                    new RegExp(`([\\d.]+)\\s*${range.unit}.*${key}`, 'i')
                ];

                for (const pattern of patterns) {
                    const match = extractedText.match(pattern);
                    if (match && match[1]) {
                        const value = parseFloat(match[1]);
                        if (!isNaN(value)) {
                            let status = 'NORMAL';
                            if (value < range.min) status = 'LOW ⬇️';
                            else if (value > range.max) status = 'HIGH ⬆️';

                            const finding = `• ${range.name}: ${value} ${range.unit} - ${status}`;
                            if (!findings.some(f => f.includes(range.name))) {
                                findings.push(finding);
                                if (status !== 'NORMAL') {
                                    abnormalValues.push(`${range.name}: ${value} ${range.unit} (${status}) - Reference: ${range.min}-${range.max} ${range.unit}`);
                                }
                            }
                            break;
                        }
                    }
                }
            }

            // Build the summary
            summary = `📊 HEALTH REPORT ANALYSIS: "${report.title}"\n\n`;

            if (findings.length > 0) {
                summary += `📋 KEY FINDINGS:\n${findings.join('\n')}\n\n`;
            }

            if (abnormalValues.length > 0) {
                summary += `⚠️ ABNORMAL VALUES DETECTED:\n${abnormalValues.join('\n')}\n\n`;
            } else if (findings.length > 0) {
                summary += `✅ All detected values are within normal range.\n\n`;
            }

            // Add excerpt of raw extracted text if no structured findings
            if (findings.length === 0) {
                summary += `📝 EXTRACTED TEXT:\n${extractedText.substring(0, 800)}${extractedText.length > 800 ? '...' : ''}\n\n`;
            }

            summary += `⚕️ Please consult a healthcare professional for proper interpretation and treatment advice.`;
        } else {
            summary = `📊 REPORT: "${report.title}"

This ${categoryLabels[report.category] || 'medical report'} has been securely uploaded to your health vault.

📋 Type: ${report.fileType.toUpperCase()}
📁 Category: ${categoryLabels[report.category] || 'Other'}

⚕️ For detailed analysis, please consult a healthcare professional who can review the original document.`;
        }

        report.aiSummary = summary;
        report.aiAnalyzedAt = new Date();
        await report.save();

        console.log('AI Summary generated successfully');
        return summary;

    } catch (err) {
        console.error('AI Analysis Error:', err);

        // Save error-aware fallback
        try {
            const report = await HealthReport.findById(reportId);
            if (report) {
                report.aiSummary = `📊 Report "${report.title}" uploaded successfully.

This ${categoryLabels[report.category] || 'medical document'} is now stored in your health vault and accessible during emergencies.

⚕️ Please consult a healthcare professional for interpretation of your medical results.`;
                report.aiAnalyzedAt = new Date();
                await report.save();
            }
        } catch (saveErr) {
            console.error('Error saving fallback:', saveErr.message);
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

/**
 * Add a doctor's note to a report
 */
exports.addNote = async (req, res) => {
    try {
        console.log('--- Add Note Controller Start ---');
        console.log('User Role from token:', req.user.role);
        console.log('Full User object:', JSON.stringify(req.user, null, 2));

        if (req.user.role !== 'doctor') {
            return res.status(403).json({ msg: 'Only doctors can add notes' });
        }

        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ msg: 'Note content is required' });
        }

        const report = await HealthReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        // Verify doctor has access to this report (owned by the patient they are viewing)
        if (report.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Unauthorized access to this patient record' });
        }

        // Determine Doctor Identity with multiple fallbacks
        let doctorName = req.user.doctorName || req.user.name;
        let doctorEmail = req.user.doctorEmail || req.user.email;

        // If still missing, try to find a user record for this ID (in case it's a permanent doctor)
        if (!doctorName || !doctorEmail) {
            const userInDb = await User.findById(req.user.id);
            if (userInDb && userInDb.role === 'doctor') {
                doctorName = `Dr. ${userInDb.name}`;
                doctorEmail = userInDb.email;
            }
        }

        // Final fallbacks to avoid validation error (Mongoose requires these)
        if (!doctorName) doctorName = 'CareGrid Doctor';
        if (!doctorEmail) doctorEmail = 'doctor@caregrid.ai';

        const newNote = {
            doctorName,
            doctorEmail,
            content,
            createdAt: new Date()
        };

        if (!report.notes) report.notes = [];
        report.notes.push(newNote);
        await report.save();

        res.json({
            msg: 'Note added successfully',
            notes: report.notes
        });

    } catch (err) {
        console.error('Add Note Error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};
