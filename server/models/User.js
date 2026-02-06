const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed
    age: { type: Number },
    bloodGroup: { type: String },
    phone: { type: String },
    address: { type: String },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    emergencyContacts: [
        {
            name: { type: String },
            relation: { type: String },
            phone: { type: String },
            email: { type: String }
        }
    ],
    pastEmergencies: [
        {
            id: { type: String },
            date: { type: String },
            title: { type: String },
            location: { type: String },
            status: { type: String, enum: ['discharged', 'complete', 'ongoing'], default: 'complete' }
        }
    ],
    role: { type: String, enum: ['patient', 'doctor', 'responder'], default: 'patient' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

