const EmergencyCase = require('../models/EmergencyCase');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');

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

        // Get user emergency contacts
        const user = await User.findById(req.user.id);
        if (user && user.emergencyContacts) {
            newCase.notificationsSent = user.emergencyContacts.map(contact => ({
                contactName: contact.name,
                phone: contact.phone,
                email: contact.email,
                status: 'Sent'
            }));
        }

        await newCase.save();

        // Run notifications and responder assignment in the background
        (async () => {
            if (newCase.notificationsSent.length > 0) {
                for (const contact of newCase.notificationsSent) {
                    let phone = contact.phone;
                    if (!phone.startsWith('+')) {
                        if (phone.length === 10) phone = `+91${phone}`;
                        else phone = `+${phone}`;
                    }

                    const userName = user?.name || "A CareGrid User";
                    const locationAddress = location?.address || "Unknown Address";
                    const lat = location?.lat || "0";
                    const lng = location?.lng || "0";

                    const emailSubject = `🚨 EMERGENCY ALERT - ${userName} needs help!`;
                    const emailText = `ALERT! ${userName} has triggered an SOS. Live location: ${locationAddress}. Coordinates: ${lat}, ${lng}`;
                    const emailHtml = `
                        <div style="font-family: sans-serif; padding: 20px; border: 2px solid red; border-radius: 10px;">
                            <h1 style="color: red;">🚨 EMERGENCY SOS ALERT</h1>
                            <p><strong>${userName}</strong> has triggered an SOS alert.</p>
                            <p><strong>Live Location:</strong> ${locationAddress}</p>
                            <p><strong>Coordinates:</strong> ${lat}, ${lng}</p>
                            <hr />
                            <p style="font-size: 12px; color: #666;">This is an automated alert from CareGrid AI.</p>
                        </div>
                    `;

                    console.log(`\n🚨 [SOS ALERT] 🚨`);
                    console.log(`To: ${contact.email || "N/A"}`);
                    console.log(`Constructed Subject: ${emailSubject}`);
                    console.log(`HTML Length: ${emailHtml.length}`);

                    if (contact.email) {
                        try {
                            const sent = await sendEmail(contact.email, emailSubject, emailText, emailHtml);
                            if (sent) {
                                await EmergencyCase.updateOne(
                                    { _id: newCase._id, "notificationsSent.email": contact.email },
                                    { $set: { "notificationsSent.$.status": "Delivered" } }
                                );
                                // Re-emit to update UI if it reached the tracking page already
                                io.emit(`emergency_update_${newCase.user}`, await EmergencyCase.findById(newCase._id));
                            }
                        } catch (mailError) {
                            console.error(`Failed to send email to ${contact.email}:`, mailError);
                            await EmergencyCase.updateOne(
                                { _id: newCase._id, "notificationsSent.email": contact.email },
                                { $set: { "notificationsSent.$.status": "Failed" } }
                            );
                            io.emit(`emergency_update_${newCase.user}`, await EmergencyCase.findById(newCase._id));
                        }
                    }
                }
            }

            // Simulate finding a responder after 1 second
            setTimeout(async () => {
                await assignResponder(newCase._id, io);
            }, 1000);
        })().catch(err => console.error("Background SOS processing error:", err));

        res.json(newCase);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get emergency history for user
// @route   GET /api/emergency/history
exports.getHistory = async (req, res) => {
    try {
        const history = await EmergencyCase.find({
            user: req.user.id,
            status: { $in: ['resolved', 'cancelled'] }
        }).sort({ createdAt: -1 });

        res.json(history);
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

// @desc    Resolve SOS (Mark as complete)
// @route   POST /api/emergency/resolve
exports.resolveSOS = async (req, res) => {
    const { caseId } = req.body;
    try {
        const emergency = await EmergencyCase.findById(caseId);
        if (!emergency) return res.status(404).json({ msg: 'Case not found' });

        if (emergency.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        emergency.status = 'resolved';
        emergency.timeline.push({ status: 'resolved' });
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
        }, 3000);

        // Simulate Arrived
        setTimeout(async () => {
            await updateStatus(caseId, 'arrived', '0 mins', io);
        }, 6000);

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
