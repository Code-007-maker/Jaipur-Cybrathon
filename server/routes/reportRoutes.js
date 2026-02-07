const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        // Determine resource type and format based on file type
        const isPdf = file.mimetype === 'application/pdf';
        return {
            folder: 'caregrid-health-reports',
            resource_type: isPdf ? 'raw' : 'image',
            allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
            public_id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
        }
    }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ msg: err.message });
    }
    if (err) {
        return res.status(400).json({ msg: err.message });
    }
    next();
};

// Routes

// Upload a new report
// POST /api/reports/upload
router.post('/upload', auth, upload.single('file'), handleUploadError, reportController.uploadReport);

// Get all reports for current user
// GET /api/reports
router.get('/', auth, reportController.getReports);

// Get emergency-relevant reports
// GET /api/reports/emergency
router.get('/emergency', auth, reportController.getEmergencyReports);

// Get emergency reports for a specific user (for emergency responders)
// GET /api/reports/emergency/:userId
router.get('/emergency/:userId', reportController.getEmergencyReports);

// Get a single report
// GET /api/reports/:id
router.get('/:id', auth, reportController.getReport);

// Delete a report
// DELETE /api/reports/:id
router.delete('/:id', auth, reportController.deleteReport);

// Trigger AI analysis for a report
// POST /api/reports/:id/analyze
router.post('/:id/analyze', auth, reportController.triggerAnalysis);

// Toggle emergency relevance
// PATCH /api/reports/:id/emergency
router.patch('/:id/emergency', auth, reportController.toggleEmergencyRelevant);

// Add doctor's note
router.post('/:id/notes', auth, reportController.addNote);

module.exports = router;
