import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./ambulance.css";
import "./hospitalselection.css";

const HospitalSelection = () => {
    const {emergencyId} = useParams();
    const {user: authUser} = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRecommendations();
    }, [emergencyId]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            const lat = 40.7128;
            const lng = -74.0060;
            const emergency = await apiService.getEmergency(emergencyId);
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

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const displayName = authUser?.first_name || authUser?.username || "Driver";
    const displayRole = authUser?.role_display || authUser?.role || "Ambulance Driver";

    return (
        <div className="dashboard-container">
            {/* HEADER */}
            <div className="top-header">
                <div className="left-section">
                    <div className="logo-section">
                        <img
                            src="/src/assets/rapidcarelogo.png"
                            alt="RapidCare Logo"
                            className="logo"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                            }}
                        />
                        <div className="brand-section">
                            <span className="brand-name">RapidCare</span>
                            <span className="ambulance-unit">Select Hospital</span>
                        </div>
                    </div>

                    <div className={`nav-buttons ${isMobileMenuOpen ? "mobile-open" : ""}`}>
                        <button className="nav-btn" onClick={() => handleNavigation("/ambulance")}>Dashboard</button>
                        <button className="nav-btn" onClick={() => handleNavigation("/emergencies")}>Emergencies
                        </button>
                        <button className="nav-btn" onClick={() => handleNavigation("/hospitals")}>Hospitals</button>
                        <button className="nav-btn" onClick={() => handleNavigation("/settings")}>Settings</button>
                    </div>

                    <button className="hamburger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? "✕" : "☰"}
                    </button>
                </div>

                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-avatar">🚑</span>
                        <div className="user-details">
                            <span className="user-name">{displayName}</span>
                            <span className="user-role">{displayRole}</span>
                        </div>
                        <span className="dropdown-arrow">▼</span>
                    </div>
                </div>
            </div>

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
                {loading && (
                    <div className="hs-state-box">Loading hospital recommendations...</div>
                )}

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
                            <div className="hs-list">
                                {recommendations.map((item, index) => (
                                    <div key={item.hospital.id} className="hs-card">
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
                                                <span className="hs-stat-label">Available Beds</span>
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
                            </div>
                        )}

                        <div className="tips-box" style={{marginTop: "8px"}}>
                            <h4>💡 Selection Tips</h4>
                            <ul>
                                <li>Hospitals are ranked by bed availability, equipment, and distance</li>
                                <li>Consider the patient's specific condition when selecting</li>
                                <li>You can set a backup hospital if the primary cannot accommodate</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HospitalSelection;
