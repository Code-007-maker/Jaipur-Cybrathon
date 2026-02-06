const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Please provide name, email and password' });
    }

    try {
        const emailLower = email.toLowerCase();
        let user = await User.findOne({ email: emailLower });
        if (user) return res.status(400).json({ msg: 'User already exists with this email' });

        user = new User({ name, email: emailLower, password });
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) {
                console.error('JWT Sign Error:', err);
                return res.status(500).json({ msg: 'Error creating token' });
            }
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        res.status(500).json({ msg: 'Server error during registration. Please try again.' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }

    try {
        console.log('Login attempt:', email);
        const emailLower = email.toLowerCase();

        let user = await User.findOne({ email: emailLower });

        if (!user) {
            console.log('User not found:', emailLower);
            return res.status(400).json({ msg: 'Invalid credentials. User not found.' });
        }

        if (user.password !== password) {
            console.log('Password mismatch for:', emailLower);
            return res.status(400).json({ msg: 'Invalid credentials. Wrong password.' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) {
                console.error('JWT Sign Error:', err);
                return res.status(500).json({ msg: 'Error creating token' });
            }
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ msg: 'Server error during login. Please try again.' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/user
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
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
