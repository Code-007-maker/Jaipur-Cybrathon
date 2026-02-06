import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import api from '../utils/api';
import { Navigation, Phone, Clock } from 'lucide-react';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import { useTranslation } from 'react-i18next';

const HospitalMap = () => {
    const { t } = useTranslation();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    // Mock user location for MVP (San Francisco)
    const userLocation = { lat: 37.7749, lng: -122.4194 };

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const res = await api.get('/hospitals/nearby');
                setHospitals(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, []);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    // Fix for default marker icon in React Leaflet
    const defaultIcon = new Icon({
        iconUrl: markerIconPng, // In real app, import these properly or use CDN
        shadowUrl: markerShadowPng,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });

    // Custom Icon for Hospital (using a different color/URL logic simplified here or just reuse default with popup info)
    // For MVP we stick to standard markers but could use custom SVG

    if (loading) return <div className="p-10 text-center">{t('hospitalMap.loading')}</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('hospitalMap.title')}</h1>
                    <p className="text-slate-500">{t('hospitalMap.subtitle')}</p>
                </div>
            </header>

            <div className="h-[600px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 relative z-0">
                <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User Marker */}
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={defaultIcon}>
                        <Popup>
                            <div className="font-bold">{t('hospitalMap.youAreHere')}</div>
                        </Popup>
                    </Marker>

                    {/* Hospital Markers */}
                    {hospitals.map(hospital => (
                        <Marker
                            key={hospital._id}
                            position={[hospital.location.lat, hospital.location.lng]}
                            icon={defaultIcon}
                        >
                            <Popup className="w-64">
                                <div>
                                    <h3 className="font-bold text-lg">{hospital.name}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{hospital.location.address}</p>

                                    <div className="flex items-center gap-2 mb-2 text-sm">
                                        <Clock className="w-4 h-4 text-green-600" />
                                        <span className="text-green-700 font-medium">{calculateDistance(userLocation.lat, userLocation.lng, hospital.location.lat, hospital.location.lng)} {t('hospitalMap.kmAway')}</span>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                            <Navigation className="w-3 h-3" /> {t('hospitalMap.navigate')}
                                        </button>
                                        <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                            <Phone className="w-3 h-3" /> {t('hospitalMap.call')}
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {hospitals.map(hospital => (
                    <div key={hospital._id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{hospital.name}</h3>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                {hospital.availableBeds} {t('hospitalMap.beds')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{hospital.location.address}</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Navigation className="w-4 h-4 text-blue-500" />
                            {calculateDistance(userLocation.lat, userLocation.lng, hospital.location.lat, hospital.location.lng)} km
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HospitalMap;
