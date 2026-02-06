const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Public endpoint - Get patient health record by ID (for QR code scanning)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send(getNotFoundHTML());
        }

        const user = await User.findById(userId).select(
            'name age bloodGroup allergies chronicConditions emergencyContacts phone -_id'
        );

        if (!user) {
            return res.status(404).send(getNotFoundHTML());
        }

        // Return formatted HTML page
        res.send(getHealthRecordHTML(user));
    } catch (err) {
        console.error('Error fetching health record:', err);
        res.status(500).send(getErrorHTML());
    }
});

function getHealthRecordHTML(user) {
    const allergiesList = user.allergies && user.allergies.length > 0
        ? user.allergies.map(a => `<li class="allergy-item">${a}</li>`).join('')
        : '<li class="none">No known allergies</li>';

    const conditionsList = user.chronicConditions && user.chronicConditions.length > 0
        ? user.chronicConditions.map(c => `<li class="condition-item">${c}</li>`).join('')
        : '<li class="none">No chronic conditions</li>';

    const emergencyContactsHTML = user.emergencyContacts && user.emergencyContacts.length > 0
        ? user.emergencyContacts.map(c => `
            <div class="contact-card">
                <div class="contact-name">${c.name || 'Unknown'}</div>
                <div class="contact-relation">${c.relation || 'Contact'}</div>
                <a href="tel:${c.phone}" class="contact-phone">${c.phone || 'N/A'}</a>
            </div>
        `).join('')
        : '<p class="none">No emergency contacts registered</p>';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergency Health Record - CareGrid AI</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 24px;
            border-radius: 24px 24px 0 0;
            text-align: center;
        }
        .emergency-badge {
            background: white;
            color: #dc2626;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 12px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 4px;
        }
        .header .subtitle {
            opacity: 0.9;
            font-size: 14px;
        }
        .card {
            background: white;
            padding: 20px;
            border-bottom: 1px solid #f1f5f9;
        }
        .card:last-child {
            border-bottom: none;
            border-radius: 0 0 24px 24px;
        }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 12px;
        }
        .vital-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .vital-item {
            background: #f8fafc;
            padding: 16px;
            border-radius: 16px;
            text-align: center;
        }
        .vital-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .vital-value {
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
        }
        .vital-value.blood {
            color: #dc2626;
        }
        ul {
            list-style: none;
        }
        .allergy-item, .condition-item {
            background: #fef2f2;
            color: #dc2626;
            padding: 10px 16px;
            border-radius: 12px;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
        }
        .allergy-item::before {
            content: "⚠️";
            margin-right: 8px;
        }
        .condition-item {
            background: #fef3c7;
            color: #b45309;
        }
        .condition-item::before {
            content: "🏥";
            margin-right: 8px;
        }
        .none {
            color: #94a3b8;
            font-style: italic;
            font-size: 14px;
        }
        .contact-card {
            background: #f0fdf4;
            border: 2px solid #22c55e;
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 12px;
        }
        .contact-name {
            font-weight: 700;
            font-size: 16px;
            color: #166534;
        }
        .contact-relation {
            font-size: 12px;
            color: #16a34a;
            margin-bottom: 8px;
        }
        .contact-phone {
            display: inline-block;
            background: #22c55e;
            color: white;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 700;
            text-decoration: none;
            font-size: 16px;
        }
        .contact-phone:hover {
            background: #16a34a;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: white;
            font-size: 12px;
            opacity: 0.8;
        }
        .footer .logo {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emergency-badge">🚨 Emergency Health Record</div>
            <h1>${user.name || 'Patient'}</h1>
            <p class="subtitle">CareGrid AI Medical ID</p>
        </div>
        
        <div class="card">
            <div class="section-title">Vital Information</div>
            <div class="vital-grid">
                <div class="vital-item">
                    <div class="vital-label">Blood Group</div>
                    <div class="vital-value blood">${user.bloodGroup || 'N/A'}</div>
                </div>
                <div class="vital-item">
                    <div class="vital-label">Age</div>
                    <div class="vital-value">${user.age || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="section-title">⚠️ Allergies</div>
            <ul>${allergiesList}</ul>
        </div>

        <div class="card">
            <div class="section-title">🏥 Chronic Conditions</div>
            <ul>${conditionsList}</ul>
        </div>

        <div class="card">
            <div class="section-title">📞 Emergency Contacts</div>
            ${emergencyContactsHTML}
        </div>
    </div>
    
    <div class="footer">
        <div class="logo">CareGrid AI</div>
        <div>Emergency Medical Information System</div>
    </div>
</body>
</html>
    `;
}

function getNotFoundHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Not Found - CareGrid AI</title>
    <style>
        body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
        .box { text-align: center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #dc2626; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="box">
        <h1>Patient Not Found</h1>
        <p>This health record does not exist or has been removed.</p>
    </div>
</body>
</html>
    `;
}

function getErrorHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - CareGrid AI</title>
    <style>
        body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
        .box { text-align: center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #dc2626; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="box">
        <h1>Something Went Wrong</h1>
        <p>Unable to load health record. Please try again later.</p>
    </div>
</body>
</html>
    `;
}

module.exports = router;
