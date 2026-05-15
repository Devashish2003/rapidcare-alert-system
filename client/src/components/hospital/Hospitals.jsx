import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./Hospitals.css";

const bloodStatusClass = (units) => {
    if (units > 20) return "blood-good";
    if (units > 10) return "blood-medium";
    return "blood-low";
};

const HospitalCard = ({hospital}) => {
    const [expanded, setExpanded] = useState(false);
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const toggleDetails = async () => {
        if (expanded) { setExpanded(false); return; }
        setExpanded(true);
        if (details) return;
        try {
            setLoadingDetails(true);
            const [depts, blood, equipment] = await Promise.all([
                apiService.getDepartments(hospital.id),
                apiService.getBloodInventory(hospital.id),
                apiService.getEquipment(hospital.id),
            ]);
            setDetails({
                departments: Array.isArray(depts) ? depts : depts.results || [],
                blood: Array.isArray(blood) ? blood : blood.results || [],
                equipment: Array.isArray(equipment) ? equipment : equipment.results || [],
            });
        } catch (err) {
            console.error("Error fetching hospital details:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const totalAvailBeds = details?.departments.reduce((s, d) => s + (d.available_beds || 0), 0) ?? hospital.bed_capacity;
    const totalDoctors = details?.departments.reduce((s, d) => s + (d.doctors_on_duty || 0), 0) ?? "—";

    return (
        <div className={`hospital-card ${expanded ? "expanded" : ""}`}>
            <div className="hospital-card-header">
                <div className="hospital-card-left">
                    <div className="hospital-icon">🏥</div>
                    <div>
                        <h3 className="hospital-name">{hospital.name}</h3>
                        <p className="hospital-address">📍 {hospital.address}</p>
                        <p className="hospital-phone">📞 {hospital.phone}</p>
                    </div>
                </div>
                <div className="hospital-card-right">
                    <div className="bed-badge">
                        <span className="bed-count">{totalAvailBeds}</span>
                        <span className="bed-label">Beds Available</span>
                    </div>
                    {details && (
                        <div className="doctor-badge">
                            <span className="doctor-count">{totalDoctors}</span>
                            <span className="doctor-label">Doctors on Duty</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="hospital-card-actions">
                <button className="details-btn" onClick={toggleDetails}>
                    {expanded ? "Hide Details ▲" : "View Details ▼"}
                </button>
            </div>

            {expanded && (
                <div className="hospital-details">
                    {loadingDetails && <p className="loading-text">Loading details...</p>}

                    {details && (
                        <>
                            {/* DEPARTMENTS */}
                            {details.departments.length > 0 && (
                                <div className="detail-section">
                                    <h4>Departments</h4>
                                    <div className="dept-grid">
                                        {details.departments.map((dept) => (
                                            <div key={dept.id} className={`dept-chip ${dept.is_active ? "" : "inactive"}`}>
                                                <span className="dept-name">{dept.name}</span>
                                                <span className="dept-stat">🛏 {dept.available_beds} beds</span>
                                                <span className="dept-stat">👨‍⚕️ {dept.doctors_on_duty} doctors</span>
                                                <span className={`dept-status ${dept.available_beds <= 2 ? "status-low" : "status-ok"}`}>
                                                    {!dept.is_active ? "Inactive" : dept.available_beds <= 2 ? "Limited" : "Available"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BLOOD BANK */}
                            {details.blood.length > 0 && (
                                <div className="detail-section">
                                    <h4>Blood Bank</h4>
                                    <div className="blood-grid">
                                        {details.blood.map((b) => (
                                            <div key={b.id} className={`blood-chip ${bloodStatusClass(b.units_available)}`}>
                                                <span className="blood-type">{b.blood_type}</span>
                                                <span className="blood-units">{b.units_available} units</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* EQUIPMENT */}
                            {details.equipment.length > 0 && (
                                <div className="detail-section">
                                    <h4>Critical Equipment</h4>
                                    <div className="equip-grid">
                                        {details.equipment.map((eq) => (
                                            <div key={eq.id} className={`equip-chip ${eq.is_available ? "equip-ok" : "equip-no"}`}>
                                                <span>{eq.equipment_type?.replace(/_/g, " ").toUpperCase()}</span>
                                                <span>{eq.is_available ? "✓ Available" : "✗ Unavailable"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {details.departments.length === 0 && details.blood.length === 0 && details.equipment.length === 0 && (
                                <p className="no-details-text">No detailed availability data published by this hospital yet.</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const Hospitals = () => {
    const {isAuthenticated, user} = useAuth();
    const navigate = useNavigate();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getHospitals();
            setHospitals(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError("Failed to load hospitals. Please try again.");
            console.error("Error fetching hospitals:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = hospitals.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="hospitals-page">
            {/* HEADER */}
            <header className="hospitals-header">
                <div className="hospitals-header-inner">
                    <div className="hospitals-logo" onClick={() => navigate("/dashboard")} style={{cursor: "pointer"}}>
                        <img
                            src="/src/assets/rapidcarelogo.png"
                            alt="RapidCare"
                            className="h-logo"
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <span className="h-brand">RapidCare</span>
                    </div>

                    <div className="hospitals-header-actions">
                        <Link to="/dashboard" className="back-link">← Home</Link>
                        {isAuthenticated ? (
                            <span className="h-user">{user?.first_name || user?.username}</span>
                        ) : (
                            <Link to="/login" className="h-login-btn">Login</Link>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO */}
            <div className="hospitals-hero">
                <h1>Find Hospitals Near You</h1>
                <p>Check real-time bed availability, blood bank, and equipment at hospitals in your area</p>

                <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by hospital name or area..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="hospitals-search"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch("")}>✕</button>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="hospitals-body">
                {loading && (
                    <div className="hospitals-loading">
                        <div className="spinner" />
                        <p>Loading hospitals...</p>
                    </div>
                )}

                {error && (
                    <div className="hospitals-error">
                        <p>{error}</p>
                        <button onClick={fetchHospitals}>Retry</button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <p className="result-count">
                            {filtered.length} hospital{filtered.length !== 1 ? "s" : ""} found
                            {search && ` for "${search}"`}
                        </p>

                        {filtered.length === 0 ? (
                            <div className="no-results">
                                <p>No hospitals found{search ? ` matching "${search}"` : ""}.</p>
                                {search && <button onClick={() => setSearch("")} className="clear-btn">Clear search</button>}
                            </div>
                        ) : (
                            <div className="hospitals-list">
                                {filtered.map((hospital) => (
                                    <HospitalCard key={hospital.id} hospital={hospital} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Hospitals;
