const User = require('../models/User');
const DoctorOTP = require('../models/DoctorOTP');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');

// @desc    Register user
// @route   POST /api/auth/register
// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    console.log("--- Registration Start ---");
    const { name, email, password } = req.body;
    try {
        const secret = process.env.JWT_SECRET || 'caregrid_default_secret_key_2026';
        console.log("Step 1: Using JWT Secret (Fallback active if env missing)");

        console.log("Step 2: Database Check (Finding user)...");
        const emailLower = email.toLowerCase();
        let user;
        try {
            user = await User.findOne({ email: emailLower });
        } catch (dbErr) {
            console.error("Database connection error during lookup:", dbErr.message);
            return res.status(500).json({ msg: 'Database connection error', error: dbErr.message });
        }

        if (user) {
            console.log("Registration failed: User already exists");
            return res.status(400).json({ msg: 'User already exists' });
        }

        console.log("Step 3: Creating and Saving User...");
        user = new User({ name, email: emailLower, password });
        try {
            await user.save();
            console.log("User saved successfully");
        } catch (saveErr) {
            console.error("Error saving user to DB:", saveErr.message);
            return res.status(500).json({ msg: 'Error creating account', error: saveErr.message });
        }

        console.log("Step 4: Signing JWT...");
        const payload = { user: { id: user.id } };
        jwt.sign(payload, secret, { expiresIn: 360000 }, (err, token) => {
            if (err) {
                console.error("JWT Signing Error:", err);
                return res.status(500).json({ msg: 'Error generating session token' });
            }
            console.log("JWT signed successfully. Sending response.");
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error("Fatal Registration Error:", err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @desc    Check environment and DB status
// @route   GET /api/auth/health
exports.healthCheck = async (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        env: {
            JWT_SECRET: !!process.env.JWT_SECRET,
            MONGO_URI: !!process.env.MONGO_URI,
            NODE_ENV: process.env.NODE_ENV
        }
    });
};

// @desc    Check environment and DB status
// @route   GET /api/auth/health
exports.healthCheck = async (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        env: {
            JWT_SECRET: !!process.env.JWT_SECRET,
            MONGO_URI: !!process.env.MONGO_URI,
            NODE_ENV: process.env.NODE_ENV
        }
    });
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const secret = process.env.JWT_SECRET || 'caregrid_default_secret_key_2026';
        console.log('Login attempt:', email);
        const emailLower = email.toLowerCase();

        let user = await User.findOne({ email: emailLower });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.password !== password) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, secret, { expiresIn: 360000 }, (err, token) => {
            if (err) {
                console.error("JWT Signing Error:", err);
                return res.status(500).json({ msg: 'Error generating token' });
            }
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/user
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // If the token indicates a doctor role (temporary access), override the role
        if (req.user.role === 'doctor' && req.user.isTemporary) {
            user.role = 'doctor';
            user.doctorName = req.user.doctorName;
            user.doctorEmail = req.user.doctorEmail;
            user.isTemporary = true;
            // The expiresAt is in the token itself, but for the frontend calculation 
            // we can re-extract it or rely on the frontend storing it from the initial verify call.
            // Actually, we can add it here if we want to be safe on refresh.
            const token = req.header('x-auth-token');
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                user.expiresAt = decoded.exp * 1000;
            }
        }

        res.json(user);
    } catch (err) {
        console.error('GetUser Error:', err.message);
        res.status(500).json({ msg: 'Server error fetching user data' });
    }
};

// @desc    Update user profile & medical data
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    const { age, bloodGroup, phone, address, allergies, chronicConditions, emergencyContacts, pastEmergencies } = req.body;
    const profileFields = { age, bloodGroup, phone, address, allergies, chronicConditions, emergencyContacts, pastEmergencies };

    try {
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('UpdateProfile Error:', err.message);
        res.status(500).json({ msg: 'Server error updating profile' });
    }
};

// @desc    Initiate Doctor Login (Send OTP to Patient)
// @route   POST /api/auth/doctor-login-init
exports.initDoctorLogin = async (req, res) => {
    const { doctorName, doctorEmail, patientEmail } = req.body;
    try {
        const patient = await User.findOne({ email: patientEmail.toLowerCase(), role: 'patient' });
        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await DoctorOTP.deleteMany({ doctorEmail: doctorEmail.toLowerCase(), patientEmail: patientEmail.toLowerCase() });
        const newOTP = new DoctorOTP({
            doctorName,
            doctorEmail: doctorEmail.toLowerCase(),
            patientEmail: patientEmail.toLowerCase(),
            otp,
            expiresAt
        });
        await newOTP.save();

        const subject = 'Doctor Access Request - CareGrid AI';
        const text = `Hello ${patient.name}, Dr. ${doctorName} is requesting access to your medical records. Your OTP is ${otp}. This OTP is valid for 5 minutes.`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: auto;">
                <h2 style="color: #2563eb;">Medical Access Request</h2>
                <p>Hello <strong>${patient.name}</strong>,</p>
                <p>Dr. <strong>${doctorName}</strong> (${doctorEmail}) is requesting temporary access to view your medical dashboard on CareGrid AI.</p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `;

        await sendEmail(patient.email, subject, text, html);
        res.json({ msg: 'OTP sent to patient email' });
    } catch (err) {
        console.error('Doctor Login Init Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Verify Doctor OTP and Login
// @route   POST /api/auth/doctor-login-verify
exports.verifyDoctorOTP = async (req, res) => {
    const { doctorEmail, patientEmail, otp } = req.body;
    try {
        const otpRecord = await DoctorOTP.findOne({
            doctorEmail: doctorEmail.toLowerCase(),
            patientEmail: patientEmail.toLowerCase(),
            otp
        });

        if (!otpRecord) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        const patient = await User.findOne({ email: patientEmail.toLowerCase() });
        const secret = process.env.JWT_SECRET || 'caregrid_default_secret_key_2026';

        const payload = {
            user: {
                id: patient.id,
                role: 'doctor',
                doctorName: otpRecord.doctorName,
                doctorEmail: otpRecord.doctorEmail,
                isTemporary: true
            }
        };

        jwt.sign(payload, secret, { expiresIn: '30m' }, async (err, token) => {
            if (err) throw err;
            await DoctorOTP.findByIdAndDelete(otpRecord._id);
            res.json({
                token,
                user: {
                    id: patient.id,
                    name: `Dr. ${otpRecord.doctorName}`,
                    email: otpRecord.doctorEmail,
                    role: 'doctor',
                    patientName: patient.name,
                    expiresAt: Date.now() + 30 * 60 * 1000
                }
            });
        });
    } catch (err) {
        console.error('Doctor OTP Verify Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};
