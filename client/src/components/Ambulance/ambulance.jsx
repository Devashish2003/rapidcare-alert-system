import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import {useAmbulanceLocation} from "../../hooks/useAmbulanceLocation";
import AmbulanceHeader from "./AmbulanceHeader";
import "./ambulance.css";

const Ambulance = () => {
    const {user: authUser} = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getAmbulanceDashboard();
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = dashboardData?.stats || {};
    const ambulance = dashboardData?.ambulance;
    const activeEmergencies = dashboardData?.active_emergencies || [];
    const recentEmergencies = dashboardData?.recent_emergencies || [];
    const nearbyHospitals = dashboardData?.nearby_hospitals || [];

    // ── Live GPS streaming via WebSocket ─────────────────────────────────────
    const {connected: locationConnected, position} = useAmbulanceLocation(ambulance?.id);
    // ─────────────────────────────────────────────────────────────────────────

    const displayName = authUser?.first_name || authUser?.username || 'Driver';

    return (
        <div className="dashboard-container">
            <AmbulanceHeader activePath="/ambulance" unitNumber={ambulance?.unit_number}/>
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h2>Driver Dashboard</h2>
                    <p>Welcome back, {displayName}</p>
                </div>

                <button className="primary-btn" onClick={() => navigate('/new-emergency')}>+ New Emergency</button>
            </div>

            {/* Inline loading / error banners */}
            {loading && <div style={{padding: '1rem', color: '#6b7280'}}>Loading dashboard...</div>}
            {error && !loading && (
                <div style={{padding: '1rem', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '1rem 0'}}>
                    {error} — <button onClick={fetchDashboardData} style={{color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'}}>Retry</button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <div className="card">
                    <p>Status</p>
                    <h4 className="status on-duty">● {stats.status || 'On Duty'}</h4>
                </div>

                <div className="card">
                    <p>Active Emergency</p>
                    <h3>{stats.active_emergencies || 0}</h3>
                </div>

                <div className="card">
                    <p>Today's Emergencies</p>
                    <h3>{stats.today_emergencies || 0}</h3>
                </div>

                <div className="card">
                    <p>Average Response</p>
                    <h3>{stats.average_response_time || '12m'}</h3>
                </div>
            </div>

            {/* Location */}
            <div className="card location-card">
                <h4>📍 Current Location
                    <span style={{
                        marginLeft: '10px', fontSize: '12px', fontWeight: 400,
                        color: locationConnected ? '#059669' : '#9ca3af',
                    }}>
                        {locationConnected ? '● Streaming Live' : '○ Connecting...'}
                    </span>
                </h4>

                <div className="map-box">
                    <div className="map-content">
                        <div className="map-icon">➤</div>
                        <h4>Your Current Location</h4>
                        <p>
                            {position
                                ? `${Number(position.latitude).toFixed(5)}, ${Number(position.longitude).toFixed(5)}`
                                : ambulance?.current_location_lat && ambulance?.current_location_lng
                                    ? `${ambulance.current_location_lat}, ${ambulance.current_location_lng}`
                                    : 'Acquiring GPS...'}
                        </p>
                        <span className="nearby">Nearby Hospitals ({nearbyHospitals.length})</span>
                    </div>
                </div>
                <p style={{fontSize: '12px', color: '#6b7280', margin: '8px 0 0', textAlign: 'center'}}>
                    Location streams automatically every 5 seconds when connected
                </p>
            </div>

            {/* Active Emergencies */}
            {activeEmergencies.length > 0 && (
                <div className="card">
                    <h4>⚡ Active Emergencies</h4>
                    {activeEmergencies.map((emergency) => (
                        <div className="emergency-item" key={emergency.id}>
                            <div>
                                <h5>
                                    {emergency.patient_name} <span className={`badge ${emergency.severity}`}>{emergency.severity}</span>
                                </h5>
                                <p>{emergency.condition_description}</p>
                                <span className="meta">
              {emergency.assigned_hospital?.name || 'No hospital assigned'} • ETA: {emergency.eta_to_hospital || 'N/A'} • {emergency.distance_to_hospital || 'N/A'}
            </span>
                            </div>
                            <span className={`status-pill ${emergency.status}`}>{emergency.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Emergencies */}
            {recentEmergencies.length > 0 && (
                <div className="card">
                    <h4>⚡ Recent Emergencies</h4>
                    {recentEmergencies.map((emergency) => (
                        <div className="emergency-item" key={emergency.id}>
                            <div>
                                <h5>
                                    {emergency.patient_name} <span className={`badge ${emergency.severity}`}>{emergency.severity}</span>
                                </h5>
                                <p>{emergency.condition_description}</p>
                                <span className="meta">
              {emergency.assigned_hospital?.name || 'No hospital assigned'} • {new Date(emergency.completed_at).toLocaleString()}
            </span>
                            </div>
                            <span className="status-pill completed">Completed</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            <div className="tips-box">
                <h4>💡 Quick Tips</h4>
                <ul>
                    <li>Update your location regularly for accurate hospital recommendations</li>
                    <li>Enable offline mode to save emergency data without internet</li>
                    <li>Contact backup hospitals if primary hospital cannot accommodate</li>
                </ul>
            </div>
        </div>
    );
};

export default Ambulance;