const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    phone: String,
    specialties: [String],
    availableBeds: { type: Number, default: 10 },
    isOpen: { type: Boolean, default: true }
});

module.exports = mongoose.model('Hospital', HospitalSchema);
