import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./hospitaldashboard.css";

const HospitalDashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Mock user data - replace with actual auth context
        const userData = {
            name: "Dr. Sarah Johnson",
            role: "Hospital Administrator",
            avatar: "👩‍⚕️"
        };
        setUser(userData);
    }, []);
    return (
        <div className="dashboard-container">
            {/* TOP HEADER WITH LOGO */}
            <div className="top-header">
                <div className="logo-section">
                    <img src="/src/assets/rapidcarelogo.png" alt="RapidCare Logo" className="logo"
                         onError={(e) => {
                             e.target.onerror = null;
                             e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                         }}/>
                    <div className="brand-section">
                        <span className="brand-name">RapidCare</span>
                        <span className="hospital-name">City General Hospital</span>
                    </div>
                </div>

                {/* NAVIGATION BUTTONS */}
                <div className="nav-buttons">
                    <button className="nav-btn active" onClick={() => navigate('/hospital-dashboard')}>Dashboard
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/alerts')}>Alerts</button>
                    <button className="nav-btn" onClick={() => navigate('/availability')}>Availability</button>
                    <button className="nav-btn" onClick={() => navigate('/referrals')}>Referrals</button>
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

            {/* STATS */}
            <div className="stats-grid">
                <div className="card stats-card">
                    <div className="stats-icon">🚨</div>
                    <h4>Active Alerts</h4>
                    <h2>3</h2>
                </div>
                <div className="card stats-card">
                    <div className="stats-icon">🛏️</div>
                    <h4>Available Beds</h4>
                    <h2 className="green">24</h2>
                </div>
                <div className="card stats-card">
                    <div className="stats-icon">👨‍⚕️</div>
                    <h4>Doctors On Duty</h4>
                    <h2>18</h2>
                </div>
                <div className="card stats-card">
                    <div className="stats-icon">🚑</div>
                    <h4>Today's Emergencies</h4>
                    <h2>12</h2>
                </div>
            </div>

            {/* DEPARTMENTS */}
            <div className="section">
                <h3>Department Status</h3>
                <div className="dept-grid">
                    <div className="card">
                        <div className="card-header">
                            <h4>Cardiology</h4>
                            <span className="status active">Active</span>
                        </div>
                        <p>Beds Available: 8</p>
                        <p>Doctors: 5</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h4>ICU</h4>
                            <span className="status limited">Limited</span>
                        </div>
                        <p>Beds Available: 2</p>
                        <p>Doctors: 3</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h4>Emergency</h4>
                            <span className="status active">Active</span>
                        </div>
                        <p>Beds Available: 12</p>
                        <p>Doctors: 6</p>
                    </div>
                </div>
            </div>

            {/* ALERTS */}
            <div className="section">
                <div className="section-header">
                    <h3>Recent Emergency Alerts</h3>
                    <button className="btn">View All</button>
                </div>

                <div className="alert-list">
                    <div className="alert critical">
                        <div>
                            <strong>Sarah Johnson, 45F</strong>
                            <p>Cardiac Arrest</p>
                            <small>ETA: 6 mins</small>
                        </div>
                        <span className="badge blue">Acknowledged</span>
                    </div>

                    <div className="alert high">
                        <div>
                            <strong>Michael Brown, 32M</strong>
                            <p>Severe Trauma</p>
                            <small>Arrived</small>
                        </div>
                        <span className="badge green">Completed</span>
                    </div>

                    <div className="alert medium">
                        <div>
                            <strong>Lisa Wang, 28F</strong>
                            <p>Fracture</p>
                            <small>ETA: 12 mins</small>
                        </div>
                        <span className="badge gray">Pending</span>
                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="bottom-grid">
                <div className="card">
                    <h3>Quick Actions</h3>
                    <button className="action-btn">Update Bed Availability</button>
                    <button className="action-btn">Create Patient Referral</button>
                </div>

                <div className="card system-status">
                    <h3>System Status</h3>
                    <p>
                        Real-time Alerts <span className="status active">Active</span>
                    </p>
                    <p>
                        Network <span className="status active">Online</span>
                    </p>
                    <p>Last Sync: Just now</p>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;