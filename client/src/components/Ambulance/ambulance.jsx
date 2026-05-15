import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import apiService from "../../services/api";
import "./ambulance.css";

const Ambulance = () => {
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
            const data = await apiService.getAmbulanceDashboard();
            setDashboardData(data);
            
            // Set user data from ambulance info
            if (data.ambulance && data.ambulance.driver) {
                setUser({
                    name: data.ambulance.driver.username || 'Driver',
                    role: data.ambulance.driver.role || 'Ambulance Driver',
                    avatar: "🚑"
                });
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Error fetching dashboard:', err);
            
            // Set fallback user data
            setUser({
                name: "Driver",
                role: "Ambulance Driver",
                avatar: "🚑"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            
            if (dashboardData?.ambulance?.id) {
                await apiService.updateAmbulanceLocation(dashboardData.ambulance.id, {
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    address: 'Current GPS Location'
                });
                
                // Refresh dashboard data
                await fetchDashboardData();
                alert('Location updated successfully!');
            }
        } catch (err) {
            console.error('Error updating location:', err);
            alert('Failed to update location. Please try again.');
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    if (error) {
        return <div className="dashboard-container">Error: {error}</div>;
    }

    const stats = dashboardData?.stats || {};
    const ambulance = dashboardData?.ambulance;
    const activeEmergencies = dashboardData?.active_emergencies || [];
    const recentEmergencies = dashboardData?.recent_emergencies || [];
    const nearbyHospitals = dashboardData?.nearby_hospitals || [];

    return (
        <div className="dashboard-container">
            {/* TOP HEADER WITH LOGO */}
            <div className="top-header">
                <div className="left-section">
                    <div className="logo-section">
                        <img src="/src/assets/rapidcarelogo.png" alt="RapidCare Logo" className="logo"
                             onError={(e) => {
                                 e.target.onerror = null;
                                 e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                             }}/>
                        <div className="brand-section">
                            <span className="brand-name">RapidCare</span>
                            <span className="ambulance-unit">Unit #{ambulance?.unit_number || 'AMB-0000'}</span>
                        </div>
                    </div>

                    {/* NAVIGATION BUTTONS */}
                    <div className={`nav-buttons ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                        <button className="nav-btn active" onClick={() => handleNavigation('/ambulance')}>Dashboard
                        </button>
                        <button className="nav-btn" onClick={() => handleNavigation('/emergencies')}>Emergencies
                        </button>
                        <button className="nav-btn" onClick={() => handleNavigation('/hospitals')}>Hospitals</button>
                        <button className="nav-btn" onClick={() => handleNavigation('/settings')}>Settings</button>
                    </div>

                    {/* HAMBURGER MENU */}
                    <button className="hamburger-menu" onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* USER PROFILE */}
                {user && (
                    <div className="user-profile">
                        <div className="user-info" onClick={() => console.log('Open user profile')}>
                            <span className="user-avatar">{user.avatar}</span>
                            <div className="user-details">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                            <span className="dropdown-arrow">▼</span>
                        </div>
                    </div>
                )}
            </div>
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h2>Driver Dashboard</h2>
                    <p>Welcome back, {user?.name || 'Driver'}</p>
                </div>

                <button className="primary-btn" onClick={() => handleNavigation('/new-emergency')}>+ New Emergency</button>
            </div>

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
                <h4>📍 Current Location</h4>

                <div className="map-box">
                    <div className="map-content">
                        <div className="map-icon">➤</div>
                        <h4>Your Current Location</h4>
                        <p>{ambulance?.current_location_lat && ambulance?.current_location_lng 
                            ? `${ambulance.current_location_lat}, ${ambulance.current_location_lng}` 
                            : 'Location not updated'}</p>
                        <span className="nearby">Nearby Hospitals ({nearbyHospitals.length})</span>
                    </div>
                </div>
                <button className="location-btn" onClick={handleUpdateLocation}>
                    📍 Update My Location
                </button>
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