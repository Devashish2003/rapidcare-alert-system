import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import apiService from "../../services/api";
import AmbulanceHeader from "./AmbulanceHeader";
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
