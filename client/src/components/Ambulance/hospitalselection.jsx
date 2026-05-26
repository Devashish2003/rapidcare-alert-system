import React, {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {MapContainer, Marker, Popup, TileLayer, Polyline, useMap} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import AmbulanceHeader from "./AmbulanceHeader";
import "./ambulance.css";
import "./hospitalselection.css";

// Fix Leaflet default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;

// Ambulance marker — red circle with 🚑
const ambulanceIcon = L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;background:#dc2626;border-radius:50%;border:3px solid white;
                        display:flex;align-items:center;justify-content:center;font-size:16px;
                        box-shadow:0 2px 6px rgba(0,0,0,0.4);">🚑</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

// Numbered hospital marker
function hospitalIcon(rank, selected) {
    const bg = selected ? "#059669" : "#1d4ed8";
    return L.divIcon({
        className: "",
        html: `<div style="width:34px;height:34px;background:${bg};border-radius:50%;border:3px solid white;
                            display:flex;align-items:center;justify-content:center;color:white;font-size:13px;
                            font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.4);">#${rank}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
    });
}

// Fit map bounds to all markers
function FitBounds({bounds}) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 1) {
            map.fitBounds(bounds, {padding: [40, 40]});
        }
    }, [bounds, map]);
    return null;
}

const HospitalSelection = () => {
    const {emergencyId} = useParams();
    const {user: authUser} = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [ambulancePos, setAmbulancePos] = useState(null);   // {lat, lng}
    const [routeCoords, setRouteCoords] = useState(null);     // [[lat,lng], ...]
    const [hoveredId, setHoveredId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRecommendations();
    }, [emergencyId]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            const emergency = await apiService.getEmergency(emergencyId);

            let lat = emergency.pickup_location_lat;
            let lng = emergency.pickup_location_lng;

            if (!lat || !lng) {
                try {
                    const pos = await new Promise((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 8000})
                    );
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch { /* proceed without coords */
                }
            }

            if (lat && lng) setAmbulancePos({lat: parseFloat(lat), lng: parseFloat(lng)});

            const params = {lat, lng, severity: emergency.severity, blood_type: emergency.blood_type};
            const data = await apiService.recommendHospitals(params);
            setRecommendations(data.recommendations || []);
        } catch (err) {
            setError("Failed to load hospital recommendations");
            console.error("Error fetching recommendations:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch OSRM route from ambulance to the hovered/selected hospital
    const fetchRoute = async (hospitalItem) => {
        if (!ambulancePos || !hospitalItem?.hospital?.latitude || !hospitalItem?.hospital?.longitude) {
            setRouteCoords(null);
            return;
        }
        const {lat: aLat, lng: aLng} = ambulancePos;
        const hLat = parseFloat(hospitalItem.hospital.latitude);
        const hLng = parseFloat(hospitalItem.hospital.longitude);
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${aLng},${aLat};${hLng},${hLat}?geometries=geojson&overview=full`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.code === "Ok" && json.routes?.[0]) {
                // GeoJSON coordinates are [lng, lat]; Leaflet wants [lat, lng]
                const coords = json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                setRouteCoords(coords);
            } else {
                setRouteCoords(null);
            }
        } catch {
            setRouteCoords(null);
        }
    };

    const handleCardHover = (item) => {
        setHoveredId(item.hospital.id);
        fetchRoute(item);
    };

    const handleCardLeave = () => {
        setHoveredId(null);
        setRouteCoords(null);
    };

    const handleSelectHospital = async (hospitalId) => {
        try {
            setAssigning(true);
            setError(null);
            await apiService.assignHospital(emergencyId, hospitalId, false);
            setSelectedHospital(hospitalId);
            setTimeout(() => navigate("/ambulance"), 1500);
        } catch (err) {
            setError("Failed to assign hospital. Please try again.");
            console.error("Error assigning hospital:", err);
        } finally {
            setAssigning(false);
        }
    };

    // Compute bounds for fitBounds
    const mapBounds = (() => {
        const pts = [];
        if (ambulancePos) pts.push([ambulancePos.lat, ambulancePos.lng]);
        recommendations.forEach(({hospital}) => {
            if (hospital.latitude && hospital.longitude)
                pts.push([parseFloat(hospital.latitude), parseFloat(hospital.longitude)]);
        });
        return pts.length > 1 ? pts : null;
    })();

    const defaultCenter = ambulancePos
        ? [ambulancePos.lat, ambulancePos.lng]
        : [20.5937, 78.9629]; // India centre fallback

    return (
        <div className="dashboard-container">
            <AmbulanceHeader activePath="/hospital-selection"/>
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h2>Select Hospital</h2>
                    <p>Step 2 of 2 — Based on patient condition, location, and availability</p>
                </div>
                <div className="hs-steps">
                    <span className="hs-step hs-step-done">✓ Patient Details</span>
                    <div className="hs-step-line"/>
                    <span className="hs-step hs-step-active">2 Select Hospital</span>
                </div>
            </div>

            {/* BODY */}
            <div className="hs-body">
                {loading && <div className="hs-state-box">Loading hospital recommendations...</div>}

                {error && !loading && (
                    <div className="hs-state-box hs-error">
                        {error}
                        <button className="hs-retry-btn" onClick={fetchRecommendations}>Retry</button>
                    </div>
                )}

                {!loading && !error && selectedHospital && (
                    <div className="hs-success-card">
                        <span className="hs-success-icon">✓</span>
                        <h3>Hospital Assigned Successfully</h3>
                        <p>Redirecting to dashboard...</p>
                    </div>
                )}

                {!loading && !error && !selectedHospital && (
                    <>
                        {recommendations.length === 0 ? (
                            <div className="hs-state-box">
                                No hospitals available at the moment.
                                <button className="hs-retry-btn" onClick={fetchRecommendations}>Refresh</button>
                            </div>
                        ) : (
                            <div className="hs-split">
                                {/* ── LEFT: Hospital cards ── */}
                                <div className="hs-list">
                                    {recommendations.map((item, index) => (
                                        <div
                                            key={item.hospital.id}
                                            className={`hs-card ${hoveredId === item.hospital.id ? "hs-card-hover" : ""}`}
                                            onMouseEnter={() => handleCardHover(item)}
                                            onMouseLeave={handleCardLeave}
                                        >
                                            <div className="hs-card-header">
                                                <div className="hs-rank">#{index + 1}</div>
                                                <div className="hs-score">
                                                    <span className="hs-score-label">Match Score</span>
                                                    <span className="hs-score-value">{Math.round(item.score)}%</span>
                                                </div>
                                            </div>

                                            <div className="hs-info">
                                                <h3>{item.hospital.name}</h3>
                                                <p className="hs-address">📍 {item.hospital.address}</p>
                                                <p className="hs-phone">📞 {item.hospital.phone}</p>
                                            </div>

                                            <div className="hs-stats">
                                                <div className="hs-stat">
                                                    <span className="hs-stat-label">Distance</span>
                                                    <span className="hs-stat-value">{item.distance} km</span>
                                                </div>
                                                <div className="hs-stat">
                                                    <span className="hs-stat-label">ETA</span>
                                                    <span className="hs-stat-value">{item.eta}</span>
                                                </div>
                                                <div className="hs-stat">
                                                    <span className="hs-stat-label">Beds</span>
                                                    <span className="hs-stat-value">{item.available_beds}</span>
                                                </div>
                                            </div>

                                            <button
                                                className="hs-select-btn"
                                                onClick={() => handleSelectHospital(item.hospital.id)}
                                                disabled={assigning}
                                            >
                                                {assigning ? "Assigning..." : "Select Hospital"}
                                            </button>
                                        </div>
                                    ))}

                                    <div className="tips-box">
                                        <h4>💡 Selection Tips</h4>
                                        <ul>
                                            <li>Hover a card to preview the route on the map</li>
                                            <li>Ranked by beds, equipment, blood stock, and distance</li>
                                            <li>Blue numbers on the map match the list order</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* ── RIGHT: Leaflet map ── */}
                                <div className="hs-map-panel">
                                    <MapContainer
                                        center={defaultCenter}
                                        zoom={12}
                                        style={{width: "100%", height: "100%", borderRadius: "12px"}}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        {mapBounds && <FitBounds bounds={mapBounds}/>}

                                        {/* Ambulance marker */}
                                        {ambulancePos && (
                                            <Marker position={[ambulancePos.lat, ambulancePos.lng]}
                                                    icon={ambulanceIcon}>
                                                <Popup>
                                                    <strong>Your location</strong>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* Hospital markers */}
                                        {recommendations.map((item, index) => {
                                            const {hospital} = item;
                                            if (!hospital.latitude || !hospital.longitude) return null;
                                            return (
                                                <Marker
                                                    key={hospital.id}
                                                    position={[parseFloat(hospital.latitude), parseFloat(hospital.longitude)]}
                                                    icon={hospitalIcon(index + 1, hoveredId === hospital.id)}
                                                >
                                                    <Popup>
                                                        <strong>#{index + 1} {hospital.name}</strong><br/>
                                                        {item.distance} km · {item.eta}<br/>
                                                        {item.available_beds} beds available
                                                    </Popup>
                                                </Marker>
                                            );
                                        })}

                                        {/* Route polyline */}
                                        {routeCoords && (
                                            <Polyline
                                                positions={routeCoords}
                                                pathOptions={{color: "#dc2626", weight: 4, opacity: 0.8}}
                                            />
                                        )}
                                    </MapContainer>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HospitalSelection;
