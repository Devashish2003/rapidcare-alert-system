import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./availability.css";
import "./hospitaldashboard.css";

const Navigation = () => {
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
                <button className="nav-btn" onClick={() => navigate('/alerts')}>Alerts</button>
                <button className="nav-btn active" onClick={() => navigate('/availability')}>Availability</button>
                <button className="nav-btn" onClick={() => navigate('/referrals')}>Referrals</button>
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

const Availability = () => {
    const {user} = useAuth();
    const [departments, setDepartments] = useState([]);
    const [blood, setBlood] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const hospitalId = user?.profile?.hospital_id;

    useEffect(() => {
        if (hospitalId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [hospitalId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptsData, bloodData, equipData] = await Promise.all([
                apiService.getDepartments(hospitalId),
                apiService.getBloodInventory(hospitalId),
                apiService.getEquipment(hospitalId),
            ]);
            setDepartments(Array.isArray(deptsData) ? deptsData : deptsData.results || []);
            setBlood(Array.isArray(bloodData) ? bloodData : bloodData.results || []);
            setEquipment(Array.isArray(equipData) ? equipData : equipData.results || []);
        } catch (err) {
            console.error('Error fetching availability data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeptChange = (index, field, value) => {
        setDepartments(depts => depts.map((d, i) => i === index ? {...d, [field]: value} : d));
    };

    const handleBloodChange = (index, value) => {
        setBlood(b => b.map((item, i) => i === index ? {...item, units_available: parseInt(value) || 0} : item));
    };

    const handleEquipmentToggle = async (equip) => {
        try {
            const updated = await apiService.toggleEquipment(equip.id, !equip.is_available);
            setEquipment(eq => eq.map(e => e.id === equip.id ? updated : e));
        } catch (err) {
            console.error('Error toggling equipment:', err);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await Promise.all([
                ...departments.map(d => apiService.updateDepartmentAvailability(d.id, {
                    available_beds: d.available_beds,
                    doctors_on_duty: d.doctors_on_duty,
                    is_active: d.is_active,
                })),
                ...blood.map(b => apiService.updateBloodInventory(b.id, {
                    units_available: b.units_available,
                })),
            ]);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving changes:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    if (!hospitalId) {
        return (
            <div className="dashboard-container">
                <p style={{padding: '2rem', color: '#dc2626'}}>No hospital assigned to your profile.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Navigation/>

            <div className="availability-container">
                <div className="header">
                    <div>
                        <h2>Manage Availability</h2>
                        <p>Update real-time hospital capacity and resources</p>
                    </div>
                    <button className="primary-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>

                <div className="realtime-card">
                    <div>
                        <strong>Real-time Updates Active</strong>
                        <p>Last synced just now</p>
                    </div>
                    <button className="secondary-btn" onClick={fetchData}>Sync Now</button>
                </div>

                {/* DEPARTMENTS */}
                <div className="section">
                    <h3>Department Availability</h3>
                    {departments.map((dept, index) => (
                        <div key={dept.id || index} className="dept-card">
                            <div className="dept-header">
                                <h4>{dept.name}</h4>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={dept.is_active}
                                        onChange={(e) => handleDeptChange(index, 'is_active', e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="dept-inputs">
                                <div>
                                    <label>Available Beds</label>
                                    <input
                                        type="number"
                                        value={dept.available_beds}
                                        onChange={(e) => handleDeptChange(index, 'available_beds', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <label>Doctors On Duty</label>
                                    <input
                                        type="number"
                                        value={dept.doctors_on_duty}
                                        onChange={(e) => handleDeptChange(index, 'doctors_on_duty', parseInt(e.target.value) || 0)}
                                    />
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
                            <div key={b.id || index} className="blood-card">
                                <h4>{b.blood_type}</h4>
                                <input
                                    type="number"
                                    value={b.units_available}
                                    onChange={(e) => handleBloodChange(index, e.target.value)}
                                    style={{width: '60px', textAlign: 'center'}}
                                />
                                <p>Units Available</p>
                                <span className={
                                    b.units_available > 20 ? "status good" :
                                    b.units_available > 10 ? "status medium" : "status low"
                                }>
                                    {b.units_available > 20 ? "In Stock" : b.units_available > 10 ? "Medium Stock" : "Low Stock"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EQUIPMENT */}
                <div className="section">
                    <h3>Critical Equipment Status</h3>
                    <div className="equipment-grid">
                        {equipment.map((equip) => (
                            <div key={equip.id} className="equipment-card">
                                <span>{equip.equipment_type?.toUpperCase()}</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={equip.is_available}
                                        onChange={() => handleEquipmentToggle(equip)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <button className="primary-btn save-bottom" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Availability;
