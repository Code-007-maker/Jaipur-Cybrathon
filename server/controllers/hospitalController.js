const Hospital = require('../models/Hospital');

exports.getNearby = async (req, res) => {
    // For MVP, if no hospitals exist, seed them dynamically
    const count = await Hospital.countDocuments();
    if (count === 0) {
        await seedHospitals();
    }

    try {
        const hospitals = await Hospital.find();
        res.json(hospitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

async function seedHospitals() {
    const hospitals = [
        {
            name: "City General Hospital",
            location: { lat: 37.7749, lng: -122.4194, address: "1000 Main St" },
            phone: "555-0101",
            specialties: ["Trauma", "Cardiology"],
            availableBeds: 12
        },
        {
            name: "St. Mary's Medical Center",
            location: { lat: 37.7849, lng: -122.4094, address: "200 Health Way" },
            phone: "555-0102",
            specialties: ["Pediatrics", "Neurology"],
            availableBeds: 5
        },
        {
            name: "Westside Emergency Clinic",
            location: { lat: 37.7649, lng: -122.4294, address: "500 Ocean Ave" },
            phone: "555-0103",
            specialties: ["Urgent Care"],
            availableBeds: 20
        }
    ];
    await Hospital.insertMany(hospitals);
}
