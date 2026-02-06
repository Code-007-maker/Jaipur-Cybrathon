const aiService = require('../services/aiService');

exports.chat = async (req, res) => {
    const { message, history } = req.body;
    try {
        const response = await aiService.chatWithMedic(message, history || []);
        res.json({ response });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
