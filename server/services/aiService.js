const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// COMPREHENSIVE MEDICAL KNOWLEDGE BASE
// ============================================

const medicalKnowledge = {
    // Common conditions with symptoms, causes, and recommendations
    conditions: {
        cold: {
            keywords: ['cold', 'runny nose', 'sneezing', 'stuffy nose', 'nasal congestion'],
            symptoms: ['runny nose', 'sneezing', 'sore throat', 'mild cough', 'fatigue'],
            causes: 'Usually caused by rhinoviruses. Spread through droplets from infected persons.',
            treatment: 'Rest, stay hydrated, over-the-counter cold medicines. Symptoms usually resolve in 7-10 days.',
            severity: 'low',
            seeDoctor: 'If symptoms persist beyond 10 days or worsen significantly.'
        },
        flu: {
            keywords: ['flu', 'influenza', 'body aches', 'muscle pain', 'high fever', 'chills'],
            symptoms: ['high fever (101-104°F)', 'severe body aches', 'fatigue', 'headache', 'cough', 'chills'],
            causes: 'Caused by influenza viruses A or B. Highly contagious through respiratory droplets.',
            treatment: 'Rest, fluids, antiviral medications (Tamiflu) if caught early. Fever reducers for comfort.',
            severity: 'medium',
            seeDoctor: 'If you have difficulty breathing, chest pain, confusion, or symptoms that improve then return worse.'
        },
        headache: {
            keywords: ['headache', 'head pain', 'migraine', 'head hurts', 'throbbing head'],
            symptoms: ['head pain', 'sensitivity to light/sound', 'nausea (with migraines)', 'neck tension'],
            causes: 'Tension, stress, dehydration, poor sleep, eye strain, migraines, or underlying conditions.',
            treatment: 'Rest in a dark room, hydration, OTC pain relievers (ibuprofen, acetaminophen). Cold compress may help.',
            severity: 'low',
            seeDoctor: 'If headache is sudden and severe ("thunderclap"), accompanied by fever/stiff neck, or after head injury.'
        },
        stomachAche: {
            keywords: ['stomach ache', 'stomach pain', 'abdominal pain', 'belly pain', 'tummy ache', 'stomach cramps'],
            symptoms: ['abdominal discomfort', 'bloating', 'nausea', 'cramping'],
            causes: 'Indigestion, gas, food poisoning, stress, or gastrointestinal infections.',
            treatment: 'Avoid solid foods temporarily, sip water or clear fluids, try ginger tea. Avoid spicy/fatty foods.',
            severity: 'low',
            seeDoctor: 'If pain is severe, accompanied by bloody stool, vomiting blood, or lasts more than 48 hours.'
        },
        diarrhea: {
            keywords: ['diarrhea', 'loose stool', 'watery stool', 'frequent bowel'],
            symptoms: ['frequent loose stools', 'abdominal cramps', 'nausea', 'urgency'],
            causes: 'Viral/bacterial infection, food poisoning, medication side effects, IBS.',
            treatment: 'Stay hydrated with electrolyte solutions (ORS). BRAT diet (bananas, rice, applesauce, toast). Avoid dairy.',
            severity: 'medium',
            seeDoctor: 'If diarrhea persists beyond 2 days, contains blood, or you show signs of dehydration.'
        },
        fever: {
            keywords: ['fever', 'temperature', 'hot', 'feeling hot', 'body hot'],
            symptoms: ['elevated body temperature (>100.4°F/38°C)', 'chills', 'sweating', 'weakness'],
            causes: 'Infection (viral/bacterial), inflammation, heat exhaustion, medication reaction.',
            treatment: 'Rest, stay hydrated, take fever reducers (paracetamol/acetaminophen). Cool compresses on forehead.',
            severity: 'medium',
            seeDoctor: 'If fever exceeds 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe symptoms.'
        },
        cough: {
            keywords: ['cough', 'coughing', 'dry cough', 'wet cough', 'phlegm', 'mucus cough'],
            symptoms: ['persistent coughing', 'chest irritation', 'sore throat', 'possibly mucus production'],
            causes: 'Common cold, flu, allergies, asthma, bronchitis, or acid reflux.',
            treatment: 'Honey in warm water, stay hydrated, use humidifier, OTC cough suppressants or expectorants.',
            severity: 'low',
            seeDoctor: 'If cough persists beyond 3 weeks, produces blood, or is accompanied by shortness of breath.'
        },
        soreThroat: {
            keywords: ['sore throat', 'throat pain', 'painful swallowing', 'scratchy throat', 'throat hurts'],
            symptoms: ['pain when swallowing', 'scratchy/dry throat', 'swollen glands', 'red throat'],
            causes: 'Viral infections (most common), bacterial infections (strep), allergies, dry air.',
            treatment: 'Warm salt water gargles, lozenges, warm drinks with honey, adequate rest.',
            severity: 'low',
            seeDoctor: 'If accompanied by high fever, difficulty breathing/swallowing, or white patches on throat.'
        },
        allergies: {
            keywords: ['allergy', 'allergic', 'itchy eyes', 'watery eyes', 'sneezing', 'rash', 'hives'],
            symptoms: ['sneezing', 'itchy/watery eyes', 'runny nose', 'skin rash', 'hives'],
            causes: 'Immune response to allergens: pollen, dust, pet dander, certain foods, medications.',
            treatment: 'Antihistamines (cetirizine, loratadine), avoid known triggers, nasal sprays, eye drops.',
            severity: 'low',
            seeDoctor: 'If you experience difficulty breathing, swelling of face/throat (anaphylaxis) - this is an EMERGENCY.'
        },
        backPain: {
            keywords: ['back pain', 'lower back', 'spine pain', 'back hurts', 'backache'],
            symptoms: ['muscle aches', 'stabbing/shooting pain', 'limited flexibility', 'inability to stand straight'],
            causes: 'Muscle strain, poor posture, herniated disc, arthritis, osteoporosis.',
            treatment: 'Rest (but not too long), hot/cold therapy, OTC pain relievers, gentle stretching, improve posture.',
            severity: 'low',
            seeDoctor: 'If pain radiates down legs, causes numbness/weakness, or is associated with bladder/bowel problems.'
        },
        anxiety: {
            keywords: ['anxiety', 'anxious', 'panic', 'worried', 'nervous', 'stress', 'panic attack'],
            symptoms: ['racing heart', 'restlessness', 'trouble concentrating', 'sleep problems', 'excessive worry'],
            causes: 'Stress, genetics, brain chemistry, traumatic events, medical conditions.',
            treatment: 'Deep breathing exercises, regular exercise, adequate sleep, limit caffeine. Consider therapy.',
            severity: 'medium',
            seeDoctor: 'If anxiety significantly interferes with daily life, or you have thoughts of self-harm.'
        },
        insomnia: {
            keywords: ['insomnia', 'cant sleep', 'cannot sleep', 'trouble sleeping', 'sleepless', 'not sleeping'],
            symptoms: ['difficulty falling asleep', 'waking up frequently', 'daytime fatigue', 'irritability'],
            causes: 'Stress, anxiety, depression, poor sleep habits, caffeine, screen time before bed.',
            treatment: 'Establish regular sleep schedule, limit screens 1hr before bed, avoid caffeine after noon, create dark/cool room.',
            severity: 'low',
            seeDoctor: 'If insomnia persists for more than a month or significantly affects daily functioning.'
        },
        diabetes: {
            keywords: ['diabetes', 'blood sugar', 'high sugar', 'diabetic', 'glucose'],
            symptoms: ['increased thirst', 'frequent urination', 'unexplained weight loss', 'fatigue', 'blurred vision'],
            causes: 'Type 1: autoimmune destruction of insulin cells. Type 2: insulin resistance (lifestyle/genetic factors).',
            treatment: 'Blood sugar monitoring, healthy diet, regular exercise, medication (metformin, insulin as needed).',
            severity: 'high',
            seeDoctor: 'Diabetes requires medical management. See a doctor for proper diagnosis and treatment plan.'
        },
        hypertension: {
            keywords: ['blood pressure', 'high blood pressure', 'hypertension', 'bp high'],
            symptoms: ['Often silent. May include: headaches, shortness of breath, nosebleeds in severe cases'],
            causes: 'Genetics, obesity, lack of exercise, high salt diet, stress, age.',
            treatment: 'Lifestyle changes: reduce salt, exercise regularly, maintain healthy weight. Medications if needed.',
            severity: 'high',
            seeDoctor: 'Essential to have regular BP monitoring. Uncontrolled hypertension can lead to heart disease/stroke.'
        },
        asthma: {
            keywords: ['asthma', 'wheezing', 'breathing difficulty', 'shortness of breath', 'tight chest'],
            symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing (especially at night)'],
            causes: 'Allergic reactions, respiratory infections, exercise, cold air, airborne irritants.',
            treatment: 'Quick-relief inhalers (albuterol), long-term control medications, avoid triggers.',
            severity: 'medium',
            seeDoctor: 'If you have frequent attacks, need to use inhaler often, or symptoms worsen despite treatment.'
        },
        skinRash: {
            keywords: ['rash', 'skin rash', 'itchy skin', 'red skin', 'bumps on skin', 'skin irritation'],
            symptoms: ['redness', 'itching', 'blisters or bumps', 'dry/scaly skin', 'swelling'],
            causes: 'Allergies, eczema, psoriasis, infections, contact dermatitis, heat rash.',
            treatment: 'Avoid scratching, cool compresses, moisturizers, OTC hydrocortisone cream, antihistamines for itching.',
            severity: 'low',
            seeDoctor: 'If rash spreads rapidly, is painful, shows signs of infection (pus, warmth), or is accompanied by fever.'
        },
        uti: {
            keywords: ['uti', 'urinary', 'burning urination', 'frequent urination', 'bladder infection', 'urine infection'],
            symptoms: ['burning during urination', 'frequent urge to urinate', 'cloudy/strong-smelling urine', 'pelvic pain'],
            causes: 'Bacterial infection in the urinary tract, often E. coli. Risk increases with dehydration.',
            treatment: 'Antibiotics (prescribed by doctor), drink plenty of water, cranberry juice may help prevent.',
            severity: 'medium',
            seeDoctor: 'UTIs require antibiotics. See a doctor for proper diagnosis and treatment, especially if you have fever.'
        },
        conjunctivitis: {
            keywords: ['pink eye', 'red eye', 'eye infection', 'conjunctivitis', 'itchy eye', 'eye discharge'],
            symptoms: ['redness in eye', 'itching/burning', 'discharge', 'crusty eyelids in morning', 'tearing'],
            causes: 'Viral infection (most common), bacterial infection, allergies, irritants.',
            treatment: 'Cold compresses, artificial tears. Antibiotic drops if bacterial. Avoid touching/rubbing eyes.',
            severity: 'low',
            seeDoctor: 'If you experience severe pain, vision changes, or symptoms don\'t improve in a few days.'
        },
        sinusitis: {
            keywords: ['sinus', 'sinusitis', 'sinus pressure', 'blocked nose', 'facial pain', 'sinus headache'],
            symptoms: ['facial pain/pressure', 'nasal congestion', 'thick nasal discharge', 'reduced smell', 'headache'],
            causes: 'Viral infection (common cold), bacterial infection, allergies, nasal polyps.',
            treatment: 'Nasal decongestants, steam inhalation, saline rinses, rest, humidifier.',
            severity: 'low',
            seeDoctor: 'If symptoms persist beyond 10 days, you have high fever, or symptoms worsen after initial improvement.'
        },
        gastritis: {
            keywords: ['gastritis', 'acid reflux', 'heartburn', 'stomach acid', 'burning stomach', 'indigestion'],
            symptoms: ['burning sensation in stomach', 'nausea', 'vomiting', 'bloating', 'feeling of fullness'],
            causes: 'H. pylori bacteria, NSAIDs overuse, excessive alcohol, stress, spicy foods.',
            treatment: 'Antacids, H2 blockers, PPIs (omeprazole), avoid spicy/acidic foods, eat smaller meals.',
            severity: 'medium',
            seeDoctor: 'If you have blood in vomit/stool, severe abdominal pain, or symptoms persist despite treatment.'
        },
        vertigo: {
            keywords: ['vertigo', 'dizzy', 'dizziness', 'room spinning', 'balance problem', 'lightheaded'],
            symptoms: ['sensation of spinning', 'loss of balance', 'nausea', 'jerky eye movements', 'headache'],
            causes: 'Inner ear problems (BPPV), Meniere\'s disease, vestibular neuritis, migraines.',
            treatment: 'Epley maneuver (for BPPV), medications (meclizine), avoid sudden position changes.',
            severity: 'medium',
            seeDoctor: 'If vertigo is severe, recurrent, accompanied by hearing loss, or associated with neurological symptoms.'
        }
    },

    // Emergency keywords that trigger urgent response
    emergencyKeywords: [
        'chest pain', 'heart attack', 'stroke', 'cant breathe', 'cannot breathe',
        'unconscious', 'severe bleeding', 'overdose', 'suicide', 'poisoning',
        'choking', 'seizure', 'severe allergic', 'anaphylaxis', 'broken bone',
        'head injury', 'passed out', 'fainting', 'cardiac arrest', 'not breathing'
    ],

    // General health tips
    healthTips: {
        hydration: 'Drink at least 8 glasses (2 liters) of water daily. More if exercising or in hot weather.',
        sleep: 'Adults need 7-9 hours of quality sleep. Maintain consistent sleep schedule.',
        exercise: '150 minutes of moderate exercise per week. Even a daily 30-minute walk helps.',
        nutrition: 'Eat a balanced diet with fruits, vegetables, whole grains, lean proteins.',
        mentalHealth: 'Practice stress management, maintain social connections, seek help when needed.'
    }
};

// ============================================
// MEDICAL CHAT FUNCTION
// ============================================

exports.chatWithMedic = async (message, history) => {
    // Check if OpenAI is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-mvp') {
        return intelligentMedicalChat(message, history);
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful and cautious medical AI assistant. Do not provide diagnosis. If the user seems to be in danger, advise them to use the SOS feature." },
                ...history,
                { role: "user", content: message }
            ],
            model: "gpt-3.5-turbo",
        });
        return completion.choices[0].message.content;
    } catch (error) {
        return intelligentMedicalChat(message, history);
    }
};

function intelligentMedicalChat(message, history = []) {
    const m = message.toLowerCase().trim();

    // Check for greetings
    if (isGreeting(m)) {
        return "Hello! I'm CareGrid AI, your medical assistant. 👋\n\nI can help you with:\n• Understanding common symptoms and conditions\n• General health advice and tips\n• When to see a doctor\n• First aid guidance\n\nHow can I assist you today?";
    }

    // Check for emergency situations
    if (isEmergency(m)) {
        return "🚨 **EMERGENCY DETECTED**\n\nBased on what you've described, this could be a medical emergency.\n\n**Please take immediate action:**\n1. Use the SOS button in the app immediately\n2. Call emergency services (108/112/911)\n3. If possible, have someone stay with you\n\nDo not delay seeking emergency care. Your safety is the priority.";
    }

    // Check for thanks/goodbye
    if (isThanksOrBye(m)) {
        return "You're welcome! Take care of your health. 💙\n\nRemember:\n• Stay hydrated\n• Get adequate rest\n• Don't hesitate to seek medical help if symptoms worsen\n\nFeel free to ask if you have more questions!";
    }

    // Check for general health questions
    if (m.includes('how to stay healthy') || m.includes('health tips') || m.includes('healthy lifestyle')) {
        return getHealthTips();
    }

    // Check for "what is" or "tell me about" questions
    const whatIsMatch = m.match(/what is (\w+)|tell me about (\w+)|explain (\w+)/);
    if (whatIsMatch) {
        const topic = whatIsMatch[1] || whatIsMatch[2] || whatIsMatch[3];
        return explainCondition(topic);
    }

    // Match symptoms to conditions
    const matchedCondition = findMatchingCondition(m);
    if (matchedCondition) {
        return formatConditionResponse(matchedCondition, m);
    }

    // Check for medication questions
    if (m.includes('medicine') || m.includes('medication') || m.includes('drug') || m.includes('take for')) {
        return "💊 **Medication Guidance**\n\nI cannot prescribe or recommend specific medications as this requires a proper medical evaluation.\n\n**General advice:**\n• Always consult a doctor or pharmacist before taking new medications\n• Follow dosage instructions carefully\n• Be aware of potential drug interactions\n• Complete the full course of prescribed antibiotics\n\nWould you like me to help you understand your symptoms so you can discuss them with a healthcare provider?";
    }

    // Check for when to see doctor question
    if (m.includes('when should i see') || m.includes('need a doctor') || m.includes('go to hospital') || m.includes('visit doctor')) {
        return "🏥 **When to See a Doctor**\n\n**Seek immediate medical attention if you have:**\n• Chest pain or difficulty breathing\n• Severe bleeding that won't stop\n• High fever (over 103°F/39.4°C)\n• Sudden confusion or difficulty speaking\n• Severe allergic reactions\n\n**Schedule a doctor's visit if:**\n• Symptoms persist beyond a week\n• You experience recurring issues\n• Home remedies aren't providing relief\n• You're concerned about your health\n\nWhat specific symptoms are you experiencing?";
    }

    // Check for prevention questions
    if (m.includes('prevent') || m.includes('avoid') || m.includes('how to not get')) {
        return "🛡️ **Disease Prevention Tips**\n\n**Immune System Support:**\n• Eat a balanced diet rich in fruits and vegetables\n• Get 7-9 hours of quality sleep\n• Exercise regularly (150 min/week)\n• Manage stress effectively\n\n**Infection Prevention:**\n• Wash hands frequently with soap\n• Avoid touching your face\n• Stay up to date on vaccinations\n• Maintain social distance when others are sick\n\n**Lifestyle:**\n• Don't smoke; limit alcohol\n• Maintain a healthy weight\n• Stay hydrated\n\nIs there a specific condition you're trying to prevent?";
    }

    // Check for first aid questions
    if (m.includes('first aid') || m.includes('what to do if') || m.includes('emergency help')) {
        return "🩹 **First Aid Basics**\n\nCould you tell me what specific situation you need first aid guidance for?\n\nI can help with:\n• Cuts and wounds\n• Burns\n• Choking\n• Fainting\n• Allergic reactions\n• Sprains and strains\n\nPlease describe the situation and I'll provide step-by-step guidance.";
    }

    // Default response for unmatched queries
    return generateHelpfulResponse(m);
}

function isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste', 'greetings'];
    return greetings.some(g => message.includes(g)) || message.length < 10;
}

function isEmergency(message) {
    return medicalKnowledge.emergencyKeywords.some(keyword => message.includes(keyword));
}

function isThanksOrBye(message) {
    const phrases = ['thank', 'thanks', 'bye', 'goodbye', 'appreciate', 'helpful'];
    return phrases.some(p => message.includes(p));
}

function findMatchingCondition(message) {
    let bestMatch = null;
    let highestScore = 0;

    for (const [conditionName, condition] of Object.entries(medicalKnowledge.conditions)) {
        let score = 0;
        for (const keyword of condition.keywords) {
            if (message.includes(keyword)) {
                score += 2;
            }
        }

        // Partial matching for symptoms
        for (const symptom of condition.symptoms) {
            const symptomWords = symptom.toLowerCase().split(' ');
            for (const word of symptomWords) {
                if (word.length > 3 && message.includes(word)) {
                    score += 1;
                }
            }
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = { name: conditionName, ...condition };
        }
    }

    return highestScore >= 2 ? bestMatch : null;
}

function formatConditionResponse(condition, userMessage) {
    const severityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
    };

    let response = `Based on what you've described, this might be related to **${formatConditionName(condition.name)}**.\n\n`;

    response += `${severityEmoji[condition.severity]} **Severity Level:** ${condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1)}\n\n`;

    response += `📋 **Common Symptoms:**\n`;
    condition.symptoms.forEach(s => {
        response += `• ${s}\n`;
    });

    response += `\n🔍 **Possible Causes:**\n${condition.causes}\n`;

    response += `\n💡 **Recommended Treatment:**\n${condition.treatment}\n`;

    response += `\n⚠️ **See a Doctor If:**\n${condition.seeDoctor}\n`;

    response += `\n---\n*Disclaimer: This is general information only and not a medical diagnosis. Please consult a healthcare professional for proper evaluation.*`;

    return response;
}

function formatConditionName(name) {
    const nameMap = {
        cold: 'Common Cold',
        flu: 'Influenza (Flu)',
        headache: 'Headache/Migraine',
        stomachAche: 'Stomach Ache',
        diarrhea: 'Diarrhea',
        fever: 'Fever',
        cough: 'Cough',
        soreThroat: 'Sore Throat',
        allergies: 'Allergies',
        backPain: 'Back Pain',
        anxiety: 'Anxiety',
        insomnia: 'Sleep Disorder (Insomnia)',
        diabetes: 'Diabetes',
        hypertension: 'High Blood Pressure (Hypertension)',
        asthma: 'Asthma',
        skinRash: 'Skin Rash',
        uti: 'Urinary Tract Infection (UTI)',
        conjunctivitis: 'Conjunctivitis (Pink Eye)',
        sinusitis: 'Sinusitis',
        gastritis: 'Gastritis/Acid Reflux',
        vertigo: 'Vertigo/Dizziness'
    };
    return nameMap[name] || name;
}

function explainCondition(topic) {
    const condition = Object.entries(medicalKnowledge.conditions).find(([name, data]) =>
        name.toLowerCase() === topic.toLowerCase() ||
        data.keywords.some(k => k.includes(topic.toLowerCase()))
    );

    if (condition) {
        const [name, data] = condition;
        return formatConditionResponse({ name, ...data }, topic);
    }

    return `I don't have detailed information about "${topic}" in my knowledge base. Could you describe your symptoms instead? That way I can provide more relevant guidance.\n\nYou can ask me about common conditions like:\n• Cold, Flu, Fever\n• Headache, Back pain\n• Stomach issues, Gastritis\n• Allergies, Skin rash\n• Anxiety, Insomnia\n• And more...`;
}

function getHealthTips() {
    const tips = medicalKnowledge.healthTips;
    return `🌟 **Essential Health Tips**\n\n` +
        `💧 **Hydration:** ${tips.hydration}\n\n` +
        `😴 **Sleep:** ${tips.sleep}\n\n` +
        `🏃 **Exercise:** ${tips.exercise}\n\n` +
        `🥗 **Nutrition:** ${tips.nutrition}\n\n` +
        `🧠 **Mental Health:** ${tips.mentalHealth}\n\n` +
        `Would you like more specific advice on any of these areas?`;
}

function generateHelpfulResponse(message) {
    // Try to extract useful context
    if (message.includes('pain')) {
        return "I understand you're experiencing pain. To help you better, could you tell me:\n\n1. **Where** exactly is the pain located?\n2. **How long** have you had it?\n3. **How severe** is it on a scale of 1-10?\n4. Is it **constant** or does it come and go?\n5. Does anything make it **better or worse**?\n\nThis information will help me provide more relevant guidance.";
    }

    if (message.includes('symptom') || message.includes('feeling')) {
        return "I'd like to help you understand your symptoms better. Please describe:\n\n• What symptoms are you experiencing?\n• When did they start?\n• Have you noticed any triggers?\n• Any other relevant health conditions?\n\nWith more details, I can provide specific guidance.";
    }

    if (message.includes('child') || message.includes('kid') || message.includes('baby')) {
        return "👶 **Pediatric Health Note**\n\nI notice you're asking about a child's health. Children often require different treatment approaches than adults.\n\n**Important:** For children, especially infants, I strongly recommend consulting a pediatrician rather than relying solely on my guidance. Children can deteriorate quickly, and what seems minor could be serious.\n\n**Call a doctor immediately if the child has:**\n• High fever (especially under 3 months old)\n• Difficulty breathing\n• Not drinking fluids\n• Unusual drowsiness\n• Rash that doesn't fade with pressure\n\nWhat symptoms is the child experiencing?";
    }

    // Generic helpful response
    return "I'm here to help with your health concerns. 🩺\n\nTo give you the most relevant information, could you please tell me:\n\n• What specific symptoms or health concerns do you have?\n• How long have you been experiencing them?\n• Any relevant medical history?\n\nYou can also ask me about:\n• Common conditions and their treatments\n• When to see a doctor\n• General health and wellness tips\n• First aid guidance\n\nWhat would you like to know?";
}

// ============================================
// SYMPTOM ANALYSIS (for Triage)
// ============================================

exports.analyzeSymptoms = async (symptoms, vitals, history) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-mvp') {
        return intelligentAnalysis(symptoms, vitals);
    }

    try {
        const prompt = `
      Act as a medical triage AI. Analyze the following patient data:
      Symptoms: ${symptoms}
      Vitals: ${JSON.stringify(vitals)}
      Medical History: ${JSON.stringify(history)}
      
      Return a JSON object with:
      1. severity: "Low", "Medium", "High", or "Critical"
      2. possibleCauses: [array of strings]
      3. recommendedAction: string
      4. confidence: number (0-100)
      5. color: "green", "yellow", "orange", or "red"
      
      Keep it concise and safe.
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful medical triage assistant." }, { role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("OpenAI Error, falling back to intelligent analysis:", error);
        return intelligentAnalysis(symptoms, vitals);
    }
};

function intelligentAnalysis(symptoms, vitals) {
    const s = symptoms.toLowerCase();
    let severity = "Low";
    let color = "green";
    let causes = [];
    let action = "Rest and hydration. Monitor symptoms.";
    let confidence = 75;

    // Check vitals for concerning values
    let vitalsAlert = false;
    if (vitals) {
        if (vitals.heartRate && (parseInt(vitals.heartRate) > 120 || parseInt(vitals.heartRate) < 50)) {
            vitalsAlert = true;
        }
        if (vitals.temperature && parseFloat(vitals.temperature) > 102) {
            vitalsAlert = true;
        }
        if (vitals.oxygen && parseInt(vitals.oxygen) < 95) {
            vitalsAlert = true;
        }
    }

    // Critical conditions
    if (s.includes('chest pain') || s.includes('heart') || s.includes('cant breathe') || s.includes('shortness of breath')) {
        severity = "Critical";
        color = "red";
        causes = ["Possible cardiac event", "Respiratory distress", "Pulmonary embolism", "Panic attack"];
        action = "🚨 ACTIVATE SOS IMMEDIATELY. Call emergency services. Do not delay.";
        confidence = 90;
    }
    // High severity
    else if (s.includes('severe') || s.includes('bleeding') || s.includes('broken') || s.includes('unconscious') || vitalsAlert) {
        severity = "High";
        color = "orange";
        causes = ["Trauma", "Severe infection", "Acute condition requiring immediate attention"];
        action = "Visit urgent care or emergency room immediately. Do not drive yourself.";
        confidence = 85;
    }
    // Medium severity
    else if (s.includes('fever') || s.includes('vomiting') || s.includes('diarrhea') || s.includes('severe pain')) {
        severity = "Medium";
        color = "yellow";
        causes = ["Viral infection", "Bacterial infection", "Gastroenteritis", "Inflammatory condition"];
        action = "Consult a doctor within 24 hours. Stay hydrated. Rest.";
        confidence = 80;
    }
    // Low severity - match specific conditions
    else {
        const matchedCondition = findMatchingCondition(s);
        if (matchedCondition) {
            causes = [formatConditionName(matchedCondition.name), ...matchedCondition.symptoms.slice(0, 2)];
            action = matchedCondition.treatment;
            if (matchedCondition.severity === 'medium') {
                severity = "Medium";
                color = "yellow";
            }
        } else {
            causes = ["General fatigue", "Minor viral infection", "Stress-related symptoms"];
            action = "Rest, stay hydrated, and monitor symptoms. Use over-the-counter remedies as needed.";
        }
    }

    return {
        severity,
        possibleCauses: causes,
        recommendedAction: action,
        confidence,
        color
    };
}
