import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./availability.css";
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
                <button className="nav-btn" onClick={() => navigate('/alerts')}>Alerts</button>
                <button className="nav-btn active" onClick={() => navigate('/availability')}>Availability</button>
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

const Availability = () => {
    const [departments, setDepartments] = useState([
        {name: "Cardiology", beds: 8, doctors: 5, active: true},
        {name: "ICU", beds: 2, doctors: 3, active: true},
        {name: "Emergency", beds: 12, doctors: 6, active: true},
        {name: "Orthopedics", beds: 15, doctors: 4, active: true},
        {name: "Neurology", beds: 6, doctors: 3, active: false},
    ]);

    const [blood, setBlood] = useState([
        {type: "A+", units: 25},
        {type: "A-", units: 12},
        {type: "B+", units: 18},
        {type: "B-", units: 8},
        {type: "O+", units: 30},
        {type: "O-", units: 15},
        {type: "AB+", units: 10},
        {type: "AB-", units: 5},
    ]);

    const [equipment, setEquipment] = useState({
        ventilators: true,
        defibrillators: true,
        ct: true,
        mri: true,
        xray: true,
        dialysis: true,
    });

    return (
        <div className="dashboard-container">
            <Navigation activePage="availability"/>

            <div className="availability-container">
                {/* HEADER */}
                <div className="header">
                    <div>
                        <h2>Manage Availability</h2>
                        <p>Update real-time hospital capacity and resources</p>
                    </div>
                    <button className="primary-btn">Save Changes</button>
                </div>

                {/* REALTIME */}
                <div className="realtime-card">
                    <div>
                        <strong>Real-time Updates Active</strong>
                        <p>Last synced just now</p>
                    </div>
                    <button className="secondary-btn">Sync Now</button>
                </div>

                {/* DEPARTMENTS */}
                <div className="section">
                    <h3>Department Availability</h3>

                    {departments.map((dept, index) => (
                        <div key={index} className="dept-card">
                            <div className="dept-header">
                                <h4>{dept.name}</h4>

                                <label className="switch">
                                    <input type="checkbox" checked={dept.active} readOnly/>
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="dept-inputs">
                                <div>
                                    <label>Available Beds</label>
                                    <input type="number" value={dept.beds} readOnly/>
                                </div>

                                <div>
                                    <label>Doctors On Duty</label>
                                    <input type="number" value={dept.doctors} readOnly/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* BLOOD */}
                <div className="section">
                    <h3>Blood Bank Inventory</h3>

                    <div className="blood-grid">
                        {blood.map((b, index) => (
                            <div key={index} className="blood-card">
                                <h4>{b.type}</h4>
                                <p>{b.units} Units Available</p>
                                <span
                                    className={
                                        b.units > 20
                                            ? "status good"
                                            : b.units > 10
                                                ? "status medium"
                                                : "status low"
                                    }
                                >
                {b.units > 20
                    ? "In Stock"
                    : b.units > 10
                        ? "Medium Stock"
                        : "Low Stock"}
              </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EQUIPMENT */}
                <div className="section">
                    <h3>Critical Equipment Status</h3>

                    <div className="equipment-grid">
                        {Object.keys(equipment).map((key, index) => (
                            <div key={index} className="equipment-card">
                                <span>{key.toUpperCase()}</span>

                                <label className="switch">
                                    <input type="checkbox" checked={equipment[key]} readOnly/>
                                    <span className="slider"></span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <button className="primary-btn save-bottom">Save All Changes</button>
                </div>
            </div>
        </div>
    );
};

export default Availability;