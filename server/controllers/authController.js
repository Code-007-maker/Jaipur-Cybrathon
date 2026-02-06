const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile & medical data
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    const { age, bloodGroup, phone, address, allergies, chronicConditions, emergencyContacts } = req.body;
    const profileFields = { age, bloodGroup, phone, address, allergies, chronicConditions, emergencyContacts };

    try {
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true, runValidators: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
