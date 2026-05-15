import React, {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import apiService from "../../services/api";
import "./hospitalselection.css";

const HospitalSelection = () => {
    const {emergencyId} = useParams();
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
            
            // Get current location (in production, use actual GPS)
            const lat = 40.7128; // Default to NYC coordinates
            const lng = -74.0060;
            
            // Get emergency details to pass severity and blood type
            const emergency = await apiService.getEmergency(emergencyId);
            
            const params = {
                lat,
                lng,
                severity: emergency.severity,
                blood_type: emergency.blood_type
            };
            
            const data = await apiService.recommendHospitals(params);
            setRecommendations(data.recommendations || []);
        } catch (err) {
            setError('Failed to load hospital recommendations');
            console.error('Error fetching recommendations:', err);
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
            
            // Navigate back to dashboard after successful assignment
            setTimeout(() => {
                navigate('/ambulance');
            }, 1500);
        } catch (err) {
            setError('Failed to assign hospital. Please try again.');
            console.error('Error assigning hospital:', err);
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="hospital-selection-container">
                <div className="loading">Loading hospital recommendations...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="hospital-selection-container">
                <div className="error">{error}</div>
                <button className="retry-btn" onClick={fetchRecommendations}>Retry</button>
            </div>
        );
    }

    return (
        <div className="hospital-selection-container">
            {/* Top Bar */}
            <div className="topbar">
                <div className="logo">⚡ EmergencyConnect</div>
                <div className="status">🟢 Online</div>
            </div>

            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span>Dashboard</span>
                <span>›</span>
                <span>New Emergency</span>
                <span>›</span>
                <span>Select Hospital</span>
            </div>

            {/* Step Indicator */}
            <div className="steps">
                <div className="step completed">✓</div>
                <span>Patient Details</span>
                <div className="line"></div>
                <div className="step active">2</div>
                <span>Select Hospital</span>
            </div>

            {/* Header */}
            <div className="header">
                <h2>Recommended Hospitals</h2>
                <p>Based on patient condition, location, and hospital availability</p>
            </div>

            {selectedHospital ? (
                <div className="success-card">
                    <h3>✓ Hospital Assigned Successfully</h3>
                    <p>Redirecting to dashboard...</p>
                </div>
            ) : (
                <div className="hospitals-list">
                    {recommendations.length === 0 ? (
                        <div className="no-hospitals">
                            <p>No hospitals available at the moment.</p>
                            <button className="retry-btn" onClick={fetchRecommendations}>Refresh</button>
                        </div>
                    ) : (
                        recommendations.map((item, index) => (
                            <div key={item.hospital.id} className="hospital-card">
                                <div className="hospital-header">
                                    <div className="hospital-rank">#{index + 1}</div>
                                    <div className="hospital-score">
                                        <span className="score-label">Match Score</span>
                                        <span className="score-value">{Math.round(item.score)}%</span>
                                    </div>
                                </div>

                                <div className="hospital-info">
                                    <h3>{item.hospital.name}</h3>
                                    <p className="address">{item.hospital.address}</p>
                                    <p className="phone">📞 {item.hospital.phone}</p>
                                </div>

                                <div className="hospital-stats">
                                    <div className="stat">
                                        <span className="stat-label">Distance</span>
                                        <span className="stat-value">{item.distance} km</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">ETA</span>
                                        <span className="stat-value">{item.eta}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Available Beds</span>
                                        <span className="stat-value">{item.available_beds}</span>
                                    </div>
                                </div>

                                <button 
                                    className="select-btn"
                                    onClick={() => handleSelectHospital(item.hospital.id)}
                                    disabled={assigning}
                                >
                                    {assigning ? 'Assigning...' : 'Select Hospital'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Tips */}
            <div className="tips-box">
                <h4>💡 Selection Tips</h4>
                <ul>
                    <li>Hospitals are ranked based on bed availability, equipment, and distance</li>
                    <li>Consider the patient's condition when selecting a hospital</li>
                    <li>You can set a backup hospital if the primary one cannot accommodate</li>
                </ul>
            </div>
        </div>
    );
};

export default HospitalSelection;
