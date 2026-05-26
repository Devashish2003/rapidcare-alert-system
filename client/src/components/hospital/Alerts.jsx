import React, {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import {useHospitalAlerts} from "../../hooks/useHospitalAlerts";
import {playAlertSound} from "../../utils/sound";
import "./alerts.css";
import "./hospitaldashboard.css";

const Navigation = ({activePage}) => {
    const {user} = useAuth();
    const navigate = useNavigate();

    return (
        <div className="top-header">
            <div className="logo-section">
                <img src="/src/assets/rapidcarelogo.png" alt="RapidCare Logo" className="logo"
                     onError={(e) => {
                         e.target.onerror = null;
                         e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                     }}/>
                <div className="brand-section">
                    <span className="brand-name">RapidCare</span>
                    <span className="hospital-name">{user?.profile?.department || 'Hospital Staff'}</span>
                </div>
            </div>

            <div className="nav-buttons">
                <button className="nav-btn" onClick={() => navigate('/hospital-dashboard')}>Dashboard</button>
                <button className="nav-btn active" onClick={() => navigate('/alerts')}>Alerts</button>
                <button className="nav-btn" onClick={() => navigate('/availability')}>Availability</button>
                <button className="nav-btn" onClick={() => navigate('/referrals')}>Referrals</button>
                <button className="nav-btn" onClick={() => navigate('/hospital-settings')}>Settings</button>
            </div>

            {user && (
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-avatar">👩‍⚕️</span>
                        <div className="user-details">
                            <span className="user-name">{user.first_name || user.username}</span>
                            <span className="user-role">{user.role_display || user.role}</span>
                        </div>
                        <span className="dropdown-arrow">▼</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const Alert = ({alert, onAcknowledge, onReject}) => {
    return (
        <div className={`alert-card ${alert.priority}`}>
            <div className="alert-header">
                <div>
                    <span className={`priority-badge ${alert.priority}`}>{alert.priority}</span>
                    <h4>{alert.patient_name}, {alert.patient_age} {alert.patient_gender}</h4>
                    <p className="alert-description">{alert.case_description}</p>
                </div>

                <div className="alert-status">
                    <span className="status-pill">{alert.status}</span>
                    <small>{alert.time}</small>
                </div>
            </div>

            <div className="alert-info">
                <div>
                    <p className="label">ETA</p>
                    <strong>{alert.eta}</strong>
                </div>
                <div>
                    <p className="label">Distance</p>
                    <strong>{alert.distance}</strong>
                </div>
                <div>
                    <p className="label">Ambulance</p>
                    <strong>{alert.ambulance_id}</strong>
                </div>
            </div>

            <div className="alert-tags">
                {(alert.tags || []).map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                ))}
            </div>

            {alert.status === 'pending' && (
                <div className="alert-actions">
                    <button className="btn secondary">View Details</button>
                    <button className="btn success" onClick={() => onAcknowledge(alert.id)}>Acknowledge</button>
                    <button className="btn danger" onClick={() => onReject(alert.id)}>Cannot Accept</button>
                </div>
            )}
        </div>
    );
};

const Alerts = () => {
    const {user} = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const hospitalId = user?.profile?.hospital_id;

    // ── Real-time WebSocket ──────────────────────────────────────────────────
    const handleWsMessage = useCallback((payload) => {
        if (payload.type === "new_alert") {
            // Prepend the new alert and play sound
            setAlerts(prev => [payload.data, ...prev]);
            playAlertSound(payload.data.priority);
        } else if (payload.type === "alert_updated") {
            // Reflect status change from another staff member
            setAlerts(prev => prev.map(a => a.id === payload.data.id ? {...a, ...payload.data} : a));
        }
    }, []);

    const {connected: wsConnected} = useHospitalAlerts(hospitalId, handleWsMessage);
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (hospitalId) {
            fetchAlerts();
        } else {
            setLoading(false);
        }
    }, [hospitalId]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getHospitalAlerts(hospitalId);
            setAlerts(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError('Failed to load alerts. Please try again.');
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            const updated = await apiService.acknowledgeAlert(alertId);
            setAlerts(alerts.map(a => a.id === alertId ? updated : a));
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        }
    };

    const handleReject = async (alertId) => {
        try {
            const updated = await apiService.rejectAlert(alertId);
            setAlerts(alerts.map(a => a.id === alertId ? updated : a));
        } catch (err) {
            console.error('Error rejecting alert:', err);
        }
    };

    const filteredAlerts = alerts.filter(alert =>
        alert.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <Navigation activePage="alerts"/>

            <div className="alerts-container">
                <div className="alerts-header">
                    <div className="alerts-header-left">
                        <h2>Emergency Alerts
                            <span style={{
                                marginLeft: '10px', fontSize: '12px', fontWeight: 400,
                                color: wsConnected ? '#059669' : '#9ca3af',
                                verticalAlign: 'middle',
                            }}>
                                {wsConnected ? '● Live' : '○ Connecting...'}
                            </span>
                        </h2>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search by patient name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                    <div className="alerts-stats">
                        <span className="stat-item">
                            <strong>{alerts.filter(a => a.priority === 'high').length}</strong> High Priority
                        </span>
                        <span className="stat-item">
                            <strong>{alerts.filter(a => a.priority === 'medium').length}</strong> Medium Priority
                        </span>
                        <span className="stat-item">
                            <strong>{alerts.filter(a => a.priority === 'low').length}</strong> Low Priority
                        </span>
                    </div>
                </div>

                {!hospitalId && (
                    <p style={{color: '#dc2626', padding: '1rem'}}>No hospital assigned to your profile.</p>
                )}

                {loading && <p>Loading alerts...</p>}
                {error && <p style={{color: '#dc2626'}}>{error}</p>}

                <div className="alerts-list">
                    {filteredAlerts.map(alert => (
                        <Alert
                            key={alert.id}
                            alert={alert}
                            onAcknowledge={handleAcknowledge}
                            onReject={handleReject}
                        />
                    ))}
                </div>

                {!loading && filteredAlerts.length === 0 && (
                    <div className="no-alerts">
                        <p>{searchTerm ? `No alerts found for "${searchTerm}"` : "No active alerts at this time."}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;
