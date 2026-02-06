const mongoose = require('mongoose');

const EmergencyCaseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['searching', 'assigned', 'en_route', 'arrived', 'cancelled', 'resolved'],
        default: 'searching'
    },
    severity: { type: String, default: 'High' }, // Inherited from triage or default
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    assignedResponder: {
        name: String,
        vehicleId: String,
        eta: String,
        phone: String,
        location: { lat: Number, lng: Number }
    },
    timeline: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    notificationsSent: [
        {
            contactName: String,
            phone: String,
            email: String,
            status: { type: String, default: 'Sent' },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmergencyCase', EmergencyCaseSchema);
