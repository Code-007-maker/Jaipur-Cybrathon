import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Navigation, Phone, Clock, Star, MapPin, SearchX } from 'lucide-react';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import clsx from 'clsx';

// Component to recenter map when location changes
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const HospitalMap = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const location = useLocation();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState({ lat: 26.9124, lng: 75.7873 }); // Default to Jaipur
    const [locationMethod, setLocationMethod] = useState('default');
    const [specialtyFilter, setSpecialtyFilter] = useState(location.state?.specialty || null);

    useEffect(() => {
        // Get Live Location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationMethod('live');
                },
                (error) => {
                    console.log("Geolocation error, using fallback");
                    // If user has coords in profile, use those
                    if (user?.location?.lat && user?.location?.lng) {
                        setUserLocation({ lat: user.location.lat, lng: user.location.lng });
                        setLocationMethod('profile');
                    }
                }
            );
        }

        const fetchHospitals = async () => {
            try {
                const url = specialtyFilter ? `/hospitals/nearby?specialty=${specialtyFilter}` : '/hospitals/nearby';
                const res = await api.get(url);
                setHospitals(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, [specialtyFilter]);

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

    // Custom Icon for Hospital
    const coloredIcon = (color) => new Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: markerShadowPng,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    if (loading) return (
        <div className={clsx(
            "p-10 text-center",
            isDarkMode ? "text-slate-300" : "text-slate-600"
        )}>{t('hospitalMap.loading')}</div>
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={clsx(
                        "text-3xl font-bold",
                        isDarkMode ? "text-white" : "text-slate-900"
                    )}>{t('hospitalMap.title')}</h1>
                    <p className={clsx(
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                    )}>{specialtyFilter ? `Specialized care for: ${specialtyFilter}` : t('hospitalMap.subtitle')}</p>
                </div>
                {specialtyFilter && (
                    <button
                        onClick={() => setSpecialtyFilter(null)}
                        className="text-sm bg-red-100 text-red-600 px-4 py-2 rounded-full font-bold hover:bg-red-200"
                    >
                        Clear Filter
                    </button>
                )}
            </header>

            <div className={clsx(
                "h-[600px] rounded-3xl overflow-hidden shadow-xl relative z-0 border",
                isDarkMode ? "border-slate-700" : "border-slate-200"
            )}>
                <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <RecenterMap center={[userLocation.lat, userLocation.lng]} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={isDarkMode
                            ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        }
                    />

                    {/* User Marker */}
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={coloredIcon('blue')}>
                        <Popup>
                            <div className="font-bold">{t('hospitalMap.youAreHere')}</div>
                        </Popup>
                    </Marker>

                    {/* Hospital Markers */}
                    {hospitals.map(hospital => (
                        <Marker
                            key={hospital._id}
                            position={[hospital.location.lat, hospital.location.lng]}
                            icon={hospital.matchesSpecialty ? coloredIcon('green') : coloredIcon('gold')}
                        >
                            <Popup className="w-64">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-lg">{hospital.name}</h3>
                                        {hospital.matchesSpecialty && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">{hospital.location.address}</p>

                                    <div className="flex items-center gap-2 mb-2 text-sm">
                                        <Clock className="w-4 h-4 text-green-600" />
                                        <span className="text-green-700 font-medium">
                                            {calculateDistance(userLocation.lat, userLocation.lng, hospital.location.lat, hospital.location.lng)} {t('hospitalMap.kmAway')}
                                        </span>
                                    </div>

                                    {hospital.matchesSpecialty && (
                                        <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded mb-3 border border-green-200 inline-block uppercase">
                                            Recommended for {specialtyFilter}
                                        </div>
                                    )}

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
                {hospitals.length > 0 ? (
                    hospitals.map(hospital => (
                        <div key={hospital._id} className={clsx(
                            "p-4 rounded-xl border transition-all relative overflow-hidden",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100",
                            hospital.matchesSpecialty && (isDarkMode ? "ring-2 ring-emerald-500/50" : "ring-2 ring-emerald-500 shadow-emerald-100 shadow-lg")
                        )}>
                            {hospital.matchesSpecialty && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl uppercase">
                                    Better Match
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={clsx(
                                    "font-bold line-clamp-1 pr-4",
                                    isDarkMode ? "text-white" : "text-slate-900"
                                )}>{hospital.name}</h3>
                                <span className={clsx(
                                    "text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0",
                                    isDarkMode ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                                )}>
                                    {hospital.availableBeds} {t('hospitalMap.beds')}
                                </span>
                            </div>
                            <p className={clsx(
                                "text-xs mb-3 line-clamp-1",
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                            )}>{hospital.location?.address}</p>
                            <div className={clsx(
                                "flex items-center gap-2 text-sm font-medium",
                                isDarkMode ? "text-slate-300" : "text-slate-700"
                            )}>
                                <Navigation className="w-4 h-4 text-blue-500" />
                                {calculateDistance(userLocation.lat, userLocation.lng, hospital.location?.lat, hospital.location?.lng)} km
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={clsx(
                        "col-span-full p-12 text-center rounded-3xl border border-dashed flex flex-col items-center gap-4",
                        isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                        <SearchX className="w-12 h-12 opacity-50" />
                        <div>
                            <p className="text-lg font-bold">No hospitals found nearby</p>
                            <p className="text-sm">Try clearing your filters or increasing your search radius.</p>
                        </div>
                        {specialtyFilter && (
                            <button
                                onClick={() => setSpecialtyFilter(null)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Show All Hospitals
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalMap;
