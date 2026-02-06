const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const emailLower = email.toLowerCase();
        let user = await User.findOne({ email: emailLower });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email: emailLower, password }); // Note: Passwords should be hashed using bcrypt here
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Login attempt:', email);
        const emailLower = email.toLowerCase();

        // Check for mock user bypass if needed, but standard flow here
        let user = await User.findOne({ email: emailLower });

        if (!user) {
            console.log('User not found:', emailLower);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.password !== password) {
            console.log('Password mismatch for:', emailLower);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
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
