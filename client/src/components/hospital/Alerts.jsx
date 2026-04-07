import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./alerts.css";
import "./hospitaldashboard.css";

const Navigation = ({activePage}) => {
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
                <button className="nav-btn" onClick={() => navigate('/hospital-dashboard')}>Dashboard</button>
                <button className="nav-btn active" onClick={() => navigate('/alerts')}>Alerts</button>
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
    );
};

const Alert = ({alert, onAcknowledge, onReject}) => {
    return (
        <div className={`alert-card ${alert.priority}`}>
            {/* HEADER */}
            <div className="alert-header">
                <div>
          <span className={`priority-badge ${alert.priority}`}>
            {alert.priority}
          </span>
                    <h4>
                        {alert.name}, {alert.age} {alert.gender}
                    </h4>
                    <p className="alert-description">{alert.case}</p>
                </div>

                <div className="alert-status">
                    <span className="status-pill">{alert.status}</span>
                    <small>{alert.time}</small>
                </div>
            </div>

            {/* INFO ROW */}
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
                    <strong>{alert.ambulanceId}</strong>
                </div>
            </div>

            {/* TAGS */}
            <div className="alert-tags">
                {alert.tags.map((tag, index) => (
                    <span key={index} className="tag">
            {tag}
          </span>
                ))}
            </div>

            {/* ACTIONS */}
            <div className="alert-actions">
                <button className="btn secondary">View Details</button>

                <button
                    className="btn success"
                    onClick={() => onAcknowledge(alert.id)}
                >
                    Acknowledge
                </button>

                <button
                    className="btn danger"
                    onClick={() => onReject(alert.id)}
                >
                    Cannot Accept
                </button>
            </div>
        </div>
    );
};

const Alerts = () => {
    const [alerts, setAlerts] = useState([
        {
            id: 1,
            name: "John Doe",
            age: 45,
            gender: "Male",
            case: "Chest pain - suspected heart attack",
            priority: "high",
            status: "Pending",
            time: "2 mins ago",
            eta: "5 mins",
            distance: "2.3 km",
            ambulanceId: "AMB-001",
            tags: ["Cardiac", "Emergency", "Adult"]
        },
        {
            id: 2,
            name: "Jane Smith",
            age: 32,
            gender: "Female",
            case: "Motor vehicle accident - multiple injuries",
            priority: "medium",
            status: "Pending",
            time: "5 mins ago",
            eta: "8 mins",
            distance: "3.7 km",
            ambulanceId: "AMB-002",
            tags: ["Trauma", "Emergency", "Adult"]
        },
        {
            id: 3,
            name: "Robert Johnson",
            age: 67,
            gender: "Male",
            case: "Difficulty breathing - COPD exacerbation",
            priority: "low",
            status: "Pending",
            time: "8 mins ago",
            eta: "12 mins",
            distance: "5.1 km",
            ambulanceId: "AMB-003",
            tags: ["Respiratory", "Non-Emergency", "Senior"]
        }
    ]);
    const [searchTerm, setSearchTerm] = useState("");

    const handleAcknowledge = (alertId) => {
        setAlerts(alerts.map(alert =>
            alert.id === alertId
                ? {...alert, status: "Acknowledged"}
                : alert
        ));
    };

    const handleReject = (alertId) => {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredAlerts = alerts.filter(alert =>
        alert.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <Navigation activePage="alerts"/>

            <div className="alerts-container">
                <div className="alerts-header">
                    <div className="alerts-header-left">
                        <h2>Emergency Alerts</h2>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search by applicant name..."
                                value={searchTerm}
                                onChange={handleSearch}
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

                {filteredAlerts.length === 0 && (
                    <div className="no-alerts">
                        <p>{searchTerm ? `No alerts found for "${searchTerm}"` : "No active alerts at this time."}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;
