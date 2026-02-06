const mongoose = require('mongoose');

const DoctorOTPSchema = new mongoose.Schema({
    doctorEmail: { type: String, required: true },
    doctorName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '5m' } } // OTP expires in 5 minutes
});

module.exports = mongoose.model('DoctorOTP', DoctorOTPSchema);
