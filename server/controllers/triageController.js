const aiService = require('../services/aiService');
const User = require('../models/User');

exports.analyze = async (req, res) => {
    const { symptoms, vitals } = req.body;

    try {
        // Get user history for better context (optional)
        const user = await User.findById(req.user.id);
        const history = {
            age: user.age,
            conditions: user.chronicConditions,
            allergies: user.allergies
        };

        const analysis = await aiService.analyzeSymptoms(symptoms, vitals, history);
        res.json(analysis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
