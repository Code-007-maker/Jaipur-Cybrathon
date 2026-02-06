const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Will use mock if this is invalid/mock-key
});

exports.analyzeSymptoms = async (symptoms, vitals, history) => {
    // Mock fallback if no key or mock key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-mvp') {
        return mockAnalysis(symptoms, vitals);
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
        console.error("OpenAI Error, falling back to mock:", error);
        return mockAnalysis(symptoms, vitals);
    }
};

function mockAnalysis(symptoms, vitals) {
    // Simple keyword matching for demo purposes
    const s = symptoms.toLowerCase();
    let severity = "Low";
    let color = "green";
    let causes = ["General fatigue", "Viral infection", "Dehydration"];
    let action = "Rest and hydration. Monitor symptoms.";

    if (s.includes('chest pain') || s.includes('heart') || s.includes('breathing')) {
        severity = "Critical";
        color = "red";
        causes = ["Possible cardiac event", "Respiratory distress", "Panic attack"];
        action = "ACTIVATE SOS IMMEDIATELY. Seek emergency care.";
    } else if (s.includes('bleed') || s.includes('broken') || (vitals?.heartRate > 120)) {
        severity = "High";
        color = "orange";
        causes = ["Trauma", "Severe Infection", "Tachycardia"];
        action = "Visit urgent care or hospital immediately.";
    } else if (s.includes('fever') || s.includes('vomit')) {
        severity = "Medium";
        color = "yellow";
        causes = ["Flu", "Gastroenteritis", "Infection"];
        action = "Consult a doctor. Stay hydrated.";
    }

    return {
        severity,
        possibleCauses: causes,
        recommendedAction: action,
        confidence: 85,
        color
    };
}

exports.chatWithMedic = async (message, history) => {
    // Mock fallback
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-mvp') {
        return mockChat(message);
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
        return mockChat(message);
    }
};

function mockChat(message) {
    const m = message.toLowerCase();
    if (m.includes('hello') || m.includes('hi')) return "Hello! I am your AI Medical Assistant. How can I help you today?";
    if (m.includes('pain')) return "I understand you're in pain. Could you describe the location and intensity? If it is severe, use the SOS button.";
    if (m.includes('sos') || m.includes('emergency')) return "If this is an emergency, please press the red SOS button immediately or call emergency services.";
    if (m.includes('thank')) return "You're welcome. Take care.";
    return "I see. Please tell me more about your symptoms or concerns. Note: I cannot provide a diagnosis.";
}
