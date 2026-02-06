const Hospital = require('../models/Hospital');

exports.getNearby = async (req, res) => {
    // For MVP, if no hospitals exist, seed them dynamically
    const count = await Hospital.countDocuments();
    if (count === 0) {
        await seedHospitals();
    }

    const { specialty } = req.query;

    try {
        let query = {};
        let hospitals = await Hospital.find(query);

        if (specialty) {
            // Rank hospitals by specialty match
            hospitals = hospitals.map(hospital => {
                const matches = hospital.specialties.some(s => s.toLowerCase() === specialty.toLowerCase());
                return { ...hospital.toObject(), matchesSpecialty: matches };
            });

            // Sort: Specialty match first, then by distance (handled on frontend usually, but we can do a basic sort here if coordinates provided)
            hospitals.sort((a, b) => {
                if (a.matchesSpecialty && !b.matchesSpecialty) return -1;
                if (!a.matchesSpecialty && b.matchesSpecialty) return 1;
                return 0;
            });
        }

        res.json(hospitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

async function seedHospitals() {
    const hospitals = [
        {
            name: "Jaipur City Hospital",
            location: { lat: 26.9124, lng: 75.7873, address: "Ashok Nagar, Jaipur" },
            phone: "0141-2345678",
            specialties: ["Trauma", "Cardiology", "Emergency"],
            availableBeds: 15
        },
        {
            name: "Rajasthan Medical Centre",
            location: { lat: 26.9224, lng: 75.7973, address: "C-Scheme, Jaipur" },
            phone: "0141-8765432",
            specialties: ["Pediatrics", "Neurology", "General"],
            availableBeds: 8
        },
        {
            name: "Pink City Emergency Clinic",
            location: { lat: 26.9024, lng: 75.7773, address: "Malviya Nagar, Jaipur" },
            phone: "0141-1112223",
            specialties: ["Urgent Care", "General"],
            availableBeds: 25
        },
        {
            name: "Jaipur Heart Institute",
            location: { lat: 26.8924, lng: 75.8073, address: "Mansarovar, Jaipur" },
            phone: "0141-4445556",
            specialties: ["Cardiology", "Pulmonology"],
            availableBeds: 10
        },
        {
            name: "Fortis Children Hospital",
            location: { lat: 26.9324, lng: 75.7673, address: "Jawahar Nagar, Jaipur" },
            phone: "0141-9998887",
            specialties: ["Pediatrics", "Surgery"],
            availableBeds: 12
        },
        {
            name: "SMS Neuro-Trauma Hub",
            location: { lat: 26.9424, lng: 75.8173, address: "Adarsh Nagar, Jaipur" },
            phone: "0141-5556667",
            specialties: ["Neurology", "Trauma", "Surgery"],
            availableBeds: 5
        }
    ];
    await Hospital.insertMany(hospitals);
}
