import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./ambulance.css";

const Ambulance = () => {
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Mock user data - replace with actual auth context
        const userData = {
            name: "Driver Mike Wilson",
            role: "Ambulance Driver",
            avatar: "🚑"
        };
        setUser(userData);
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

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
                            <span className="ambulance-unit">Unit #AMB-4521</span>
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

                <button className="primary-btn">+ New Emergency</button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="card">
                    <p>Status</p>
                    <h4 className="status on-duty">● On Duty</h4>
                </div>

                <div className="card">
                    <p>Active Emergency</p>
                    <h3>1</h3>
                </div>

                <div className="card">
                    <p>Today's Emergencies</p>
                    <h3>5</h3>
                </div>

                <div className="card">
                    <p>Average Response</p>
                    <h3>12m</h3>
                </div>
            </div>

            {/* Location */}
            <div className="card location-card">
                <h4>📍 Current Location</h4>

                <div className="map-box">
                    <div className="map-content">
                        <div className="map-icon">➤</div>
                        <h4>Your Current Location</h4>
                        <p>Downtown Medical District</p>
                        <span className="nearby">Nearby Hospitals (12)</span>
                    </div>
                </div>
            </div>

            {/* Recent Emergencies */}
            <div className="card">
                <h4>⚡ Recent Emergencies</h4>

                <div className="emergency-item">
                    <div>
                        <h5>
                            John Doe <span className="badge critical">critical</span>
                        </h5>
                        <p>Cardiac Arrest</p>
                        <span className="meta">
              City General Hospital • ETA: 8 mins • 3.2 km
            </span>
                    </div>

                    <span className="status-pill enroute">En Route</span>
                </div>

                <div className="emergency-item">
                    <div>
                        <h5>
                            Jane Smith <span className="badge high">high</span>
                        </h5>
                        <p>Severe Trauma</p>
                        <span className="meta">
              Metro Medical Center • 2 hours ago
            </span>
                    </div>

                    <span className="status-pill completed">Completed</span>
                </div>
            </div>

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