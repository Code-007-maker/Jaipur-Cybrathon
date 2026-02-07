const EmergencyCase = require('../models/EmergencyCase');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Trigger SOS
// @route   POST /api/emergency
exports.createSOS = async (req, res) => {
    const { location, severity, triageData } = req.body;
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

        // Generate Decision Trace
        newCase.decisionTrace = generateDecisionTrace(triageData, user, severity);

        await newCase.save();

        // 🟢 TRIGGER AI ENHANCEMENT (Non-blocking)
        // Runs in background to update reasoning and emit via socket
        enhanceTraceWithAI(newCase._id, triageData, io).catch(err => console.error("AI trigger failed:", err));

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
    const caseId = req.params.id || req.body.caseId;
    console.log(`[Emergency] Attempting to resolve case: ${caseId}`);

    try {
        if (!caseId) {
            console.error('[Emergency] No case ID provided for resolution');
            return res.status(400).json({ msg: 'Case ID is required' });
        }

        const emergency = await EmergencyCase.findById(caseId);
        if (!emergency) {
            console.error(`[Emergency] Case NOT found: ${caseId}`);
            return res.status(404).json({ msg: 'Case not found' });
        }

        console.log(`[Emergency] Found case for user: ${emergency.user}. req.user.id: ${req.user.id}`);

        if (emergency.user.toString() !== req.user.id) {
            console.error(`[Emergency] Authorization mismatch. Case user: ${emergency.user}, Request user: ${req.user.id}`);
            return res.status(401).json({ msg: 'Not authorized' });
        }

        emergency.status = 'resolved';
        emergency.timeline.push({ status: 'resolved' });
        await emergency.save();

        console.log(`[Emergency] Case ${caseId} resolved successfully`);
        res.json(emergency);
    } catch (err) {
        console.error(`[Emergency] Resolve error for case ${caseId}:`, err);
        res.status(500).send('Server Error');
    }
};

// Helper to simulate responder assignment (Mock Logic)
async function assignResponder(caseId, io) {
    try {
        const emergency = await EmergencyCase.findById(caseId);
        if (!emergency || emergency.status === 'cancelled' || emergency.status === 'resolved') return;

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
    if (!emergency || emergency.status === 'cancelled' || emergency.status === 'resolved') return;

    emergency.status = status;
    if (eta) emergency.assignedResponder.eta = eta;
    emergency.timeline.push({ status });
    await emergency.save();

    io.emit(`emergency_update_${emergency.user}`, emergency);
}

// Helper to enhance the decision trace with Generative AI (Background Process)
async function enhanceTraceWithAI(emergencyId, triageData, io) {
    try {
        const emergency = await EmergencyCase.findById(emergencyId);
        if (!emergency) return;

        // Configuration for Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Construct Prompt
        const symptoms = triageData?.symptoms ? (Array.isArray(triageData.symptoms) ? triageData.symptoms.join(', ') : triageData.symptoms) : "Emergency SOS triggered";
        const vitals = triageData?.vitals ? JSON.stringify(triageData.vitals) : "Not available";
        const history = `Allergies: ${emergency.user?.allergies?.length || 0}, Chronic: ${emergency.user?.chronicConditions?.length || 0}`;

        const prompt = `
        Acting as a Medical AI Decision Support System, explain why this emergency was classified as ${emergency.severity || 'High'} risk.
        
        Input Data:
        - Symptoms: ${symptoms}
        - Vitals: ${vitals}
        - Patient History Flags: ${history}
        - Rules Triggered: ${JSON.stringify(emergency.decisionTrace.rulesTriggered || [])}

        Output JSON strictly:
        {
            "reasoning": "1-2 sentence medical explanation for the decision, clear and professional.",
            "confidence": <number 0-100>,
            "uncertainty": "Note any missing data that lowers confidence (or null if none)"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON safely
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);

            // Update the record
            emergency.decisionTrace.aiReasoning = analysis.reasoning;
            emergency.decisionTrace.confidence = analysis.confidence;
            if (analysis.uncertainty) {
                emergency.decisionTrace.uncertainty = analysis.uncertainty;
            }

            await emergency.save();

            // Real-time update to frontend
            io.emit(`emergency_update_${emergency.user}`, emergency);
        }
    } catch (err) {
        console.error("AI Trace Enhancement Failed:", err.message);
        // Fallback is already in place (template reasoning) so we just log failure
    }
}

/**
 * Helper to generate a structured decision trace for an emergency (Initial Template)
 */
function generateDecisionTrace(triageData, user, requestedSeverity) {
    const trace = {
        inputEvidence: {
            symptoms: triageData?.symptoms ? (Array.isArray(triageData.symptoms) ? triageData.symptoms : triageData.symptoms.split(', ')) : ["Emergency SOS triggered"],
            vitals: triageData?.vitals || { heartRate: "N/A", temperature: "N/A", oxygen: "N/A" },
            historyFlags: []
        },
        rulesTriggered: [],
        aiReasoning: "Initializing AI analysis...", // Placeholder while AI runs
        confidence: triageData?.confidence || 85,
        uncertainty: "",
        finalDecision: {
            severity: triageData?.severity || requestedSeverity || "High",
            category: triageData?.recommendedSpecialty || "General Emergency"
        },
        disclaimer: "AI-assisted decision support. Not a medical diagnosis."
    };

    // Add history flags if available
    if (user?.allergies?.length > 0) trace.inputEvidence.historyFlags.push(`${user.allergies.length} Allergies`);
    if (user?.chronicConditions?.length > 0) trace.inputEvidence.historyFlags.push(`${user.chronicConditions.length} Chronic Conditions`);

    // Add deterministic rules based on data
    const oxygen = triageData?.vitals?.oxygen ? parseInt(triageData.vitals.oxygen) : null;
    if (oxygen && oxygen < 92) {
        trace.rulesTriggered.push({ ruleName: "Critical Hypoxia Rule", reason: "Oxygen saturation below 92% detected." });
    }

    const symptomsText = triageData?.symptoms?.toString().toLowerCase() || "";
    if (symptomsText.includes("chest pain") || symptomsText.includes("heart")) {
        trace.rulesTriggered.push({ ruleName: "Cardiac Risk Rule", reason: "Symptoms indicate potential heart-related emergency." });
    }

    if (symptomsText.includes("breath") || symptomsText.includes("breathing")) {
        trace.rulesTriggered.push({ ruleName: "Respiratory Distress Rule", reason: "Patient reporting difficulty breathing." });
    }

    if (trace.rulesTriggered.length === 0) {
        trace.rulesTriggered.push({ ruleName: "Direct SOS Activation", reason: "SOS triggered directly by user." });
    }

    // Initial Deterministic Reasoning (Detailed Fallback/Pre-AI)
    if (triageData) {
        // Construct a sentence based on rules
        let reasoning = `System flagged this as ${trace.finalDecision.severity} priority. `;

        if (trace.rulesTriggered.length > 0) {
            const ruleNames = trace.rulesTriggered.map(r => r.ruleName.replace(' Rule', '')).join(' and ');
            reasoning += `Detected risk factors: ${ruleNames}. `;
        }

        if (trace.inputEvidence.vitals.oxygen !== "N/A" && parseInt(trace.inputEvidence.vitals.oxygen) < 94) {
            reasoning += `SpO2 level of ${trace.inputEvidence.vitals.oxygen}% indicates potential respiratory compromise. `;
        }

        trace.aiReasoning = reasoning + "AI verifying specifics...";
    } else {
        trace.aiReasoning = "Emergency SOS triggered manually. System mandates High priority response for direct distress signals until vitals are assessed.";
        trace.uncertainty = "High: Missing triage data.";
    }

    return trace;
}
