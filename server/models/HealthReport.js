const mongoose = require('mongoose');

const HealthReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['blood_test', 'imaging', 'prescription', 'discharge', 'ecg', 'other'],
        default: 'other'
    },
    fileUrl: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['pdf', 'jpg', 'jpeg', 'png'],
        required: true
    },
    aiSummary: {
        type: String,
        default: null
    },
    aiAnalyzedAt: {
        type: Date,
        default: null
    },
    isEmergencyRelevant: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    notes: [
        {
            doctorName: {
                type: String,
                required: true
            },
            doctorEmail: {
                type: String,
                required: true
            },
            content: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

// Index for faster queries
HealthReportSchema.index({ userId: 1, uploadedAt: -1 });
HealthReportSchema.index({ userId: 1, isEmergencyRelevant: 1 });

module.exports = mongoose.model('HealthReport', HealthReportSchema);
