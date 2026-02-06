const EmergencyCase = require('../models/EmergencyCase');

// @desc    Trigger SOS
// @route   POST /api/emergency
exports.createSOS = async (req, res) => {
    const { location, severity } = req.body;
    const io = req.app.get('io');

    try {
        // Close any previous active cases for this user
        await EmergencyCase.updateMany(
            { user: req.user.id, status: { $in: ['searching', 'assigned', 'en_route'] } },
            { $set: { status: 'resolved' } }
        );

        const newCase = new EmergencyCase({
            user: req.user.id,
            location,
            severity: severity || 'High',
            timeline: [{ status: 'searching' }]
        });

        await newCase.save();

        // Simulate finding a responder after 5 seconds
        setTimeout(async () => {
            await assignResponder(newCase._id, io);
        }, 5000);

        res.json(newCase);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get current active SOS
// @route   GET /api/emergency/active
exports.getActiveSOS = async (req, res) => {
    try {
        const activeCase = await EmergencyCase.findOne({
            user: req.user.id,
            status: { $in: ['searching', 'assigned', 'en_route', 'arrived'] }
        }).sort({ createdAt: -1 });

        res.json(activeCase);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Cancel SOS
// @route   POST /api/emergency/cancel
exports.cancelSOS = async (req, res) => {
    const { caseId } = req.body;
    try {
        const emergency = await EmergencyCase.findById(caseId);
        if (!emergency) return res.status(404).json({ msg: 'Case not found' });

        if (emergency.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        emergency.status = 'cancelled';
        emergency.timeline.push({ status: 'cancelled' });
        await emergency.save();

        res.json(emergency);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Helper to simulate responder assignment (Mock Logic)
async function assignResponder(caseId, io) {
    try {
        const emergency = await EmergencyCase.findById(caseId);
        if (!emergency || emergency.status === 'cancelled') return;

        emergency.status = 'assigned';
        emergency.assignedResponder = {
            name: 'Unit 42 - Paramedic Team',
            vehicleId: 'AMB-882',
            eta: '8 mins',
            phone: '555-0199',
            location: { lat: emergency.location?.lat + 0.01, lng: emergency.location?.lng + 0.01 }
        };
        emergency.timeline.push({ status: 'assigned' });
        await emergency.save();

        // Emit real-time update to specific user room if we were using rooms, 
        // or just rely on polling/status checks for this MVP as it's simpler
        // But let's try to emit if the client is listening
        io.emit(`emergency_update_${emergency.user}`, emergency);

        // Simulate En Route
        setTimeout(async () => {
            await updateStatus(caseId, 'en_route', '4 mins', io);
        }, 8000);

    } catch (err) {
        console.error("Error assigning responder:", err);
    }
}

async function updateStatus(caseId, status, eta, io) {
    const emergency = await EmergencyCase.findById(caseId);
    if (!emergency || emergency.status === 'cancelled') return;

    emergency.status = status;
    if (eta) emergency.assignedResponder.eta = eta;
    emergency.timeline.push({ status });
    await emergency.save();

    io.emit(`emergency_update_${emergency.user}`, emergency);
}
