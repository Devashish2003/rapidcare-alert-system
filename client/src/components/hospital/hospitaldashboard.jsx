import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./hospitaldashboard.css";

const HospitalDashboard = () => {
    const {user} = useAuth();
    const [stats, setStats] = useState({active_alerts: 0, available_beds: 0, doctors_on_duty: 0, todays_emergencies: 0});
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const hospitalId = user?.profile?.hospital_id;

    useEffect(() => {
        if (hospitalId) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [hospitalId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, alertsData, deptsData] = await Promise.all([
                apiService.getHospitalDashboardStats(hospitalId),
                apiService.getRecentAlerts(hospitalId),
                apiService.getDepartmentStatus(hospitalId),
            ]);
            setStats(statsData);
            setRecentAlerts(alertsData);
            setDepartments(deptsData);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    if (!hospitalId) {
        return (
            <div className="dashboard-container">
                <p style={{padding: '2rem', color: '#dc2626'}}>
                    No hospital assigned to your profile. Please contact your administrator.
                </p>
            </div>
        );
    }

    const priorityBadgeClass = (status) => {
        if (status === 'acknowledged') return 'badge blue';
        if (status === 'completed') return 'badge green';
        return 'badge gray';
    };

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
                        <span className="hospital-name">{user?.profile?.department || 'Hospital Staff'}</span>
                    </div>
                </div>

                {/* NAVIGATION BUTTONS */}
                <div className="nav-buttons">
                    <button className="nav-btn active" onClick={() => navigate('/hospital-dashboard')}>Dashboard</button>
                    <button className="nav-btn" onClick={() => navigate('/alerts')}>Alerts</button>
                    <button className="nav-btn" onClick={() => navigate('/availability')}>Availability</button>
                    <button className="nav-btn" onClick={() => navigate('/referrals')}>Referrals</button>
                </div>

                {/* USER PROFILE */}
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

            {/* STATS */}
            <div className="stats-grid">
                <div className="card stats-card">
                    <div className="stats-icon">🚨</div>
                    <h4>Active Alerts</h4>
                    <h2>{stats.active_alerts}</h2>
                </div>
                <div className="card stats-card">
                    <div className="stats-icon">🛏️</div>
                    <h4>Available Beds</h4>
                    <h2 className="green">{stats.available_beds}</h2>
                </div>
                <div className="card stats-card">
                    <div className="stats-icon">👨‍⚕️</div>
                    <h4>Doctors On Duty</h4>
                    <h2>{stats.doctors_on_duty}</h2>
                </div>
                <div className="card stats-card">
                    <div className="stats-icon">🚑</div>
                    <h4>Today's Emergencies</h4>
                    <h2>{stats.todays_emergencies}</h2>
                </div>
            </div>

            {/* DEPARTMENTS */}
            {departments.length > 0 && (
                <div className="section">
                    <h3>Department Status</h3>
                    <div className="dept-grid">
                        {departments.map((dept, index) => (
                            <div className="card" key={index}>
                                <div className="card-header">
                                    <h4>{dept.name}</h4>
                                    <span className={`status ${dept.status?.toLowerCase()}`}>{dept.status}</span>
                                </div>
                                <p>Beds Available: {dept.available_beds}</p>
                                <p>Doctors: {dept.doctors_on_duty}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ALERTS */}
            <div className="section">
                <div className="section-header">
                    <h3>Recent Emergency Alerts</h3>
                    <button className="btn" onClick={() => navigate('/alerts')}>View All</button>
                </div>

                <div className="alert-list">
                    {recentAlerts.length === 0 ? (
                        <p style={{color: '#6b7280'}}>No recent alerts.</p>
                    ) : (
                        recentAlerts.map((alert) => (
                            <div key={alert.id} className={`alert ${alert.priority}`}>
                                <div>
                                    <strong>{alert.patient_name}, {alert.patient_age}{alert.patient_gender?.[0]}</strong>
                                    <p>{alert.case_description}</p>
                                    <small>ETA: {alert.eta}</small>
                                </div>
                                <span className={priorityBadgeClass(alert.status)}>{alert.status}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* BOTTOM SECTION */}
            <div className="bottom-grid">
                <div className="card">
                    <h3>Quick Actions</h3>
                    <button className="action-btn" onClick={() => navigate('/availability')}>Update Bed Availability</button>
                    <button className="action-btn" onClick={() => navigate('/referrals')}>Create Patient Referral</button>
                </div>

                <div className="card system-status">
                    <h3>System Status</h3>
                    <p>Real-time Alerts <span className="status active">Active</span></p>
                    <p>Network <span className="status active">Online</span></p>
                    <p>Last Sync: Just now</p>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
