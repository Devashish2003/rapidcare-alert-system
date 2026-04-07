import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./referrals.css";
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
                <button className="nav-btn" onClick={() => navigate('/availability')}>Availability</button>
                <button className="nav-btn active" onClick={() => navigate('/referrals')}>Referrals</button>
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

const Referrals = () => {
    const [activeTab, setActiveTab] = useState("incoming");
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        patientName: "",
        age: "",
        receivingHospital: "",
        requiredSpecialty: "",
        currentDiagnosis: "",
        reasonForReferral: "",
        medicalDocuments: null,
    });

    // MOCK DATA (replace with API)
    const [incoming, setIncoming] = useState([
        {
            id: 1,
            patient: "David Wilson",
            age: 52,
            status: "Pending",
            from: "Metro Medical Center",
            condition: "Complex cardiac surgery required",
            reason: "Specialized cardiothoracic surgery needed",
            documents: 3,
            time: "15 mins ago",
        },
        {
            id: 2,
            patient: "Emma Davis",
            age: 34,
            status: "Accepted",
            from: "Community Hospital",
            condition: "Neurosurgery consultation",
            reason: "Brain tumor requiring immediate surgery",
            documents: 5,
            time: "2 hours ago",
        },
    ]);

    const [outgoing, setOutgoing] = useState([
        {
            id: 3,
            hospital: "City Care Hospital",
            reason: "ICU Full",
            status: "Accepted",
        },
    ]);

    // ACTIONS
    const handleAccept = (id) => {
        setIncoming(incoming.map(referral =>
            referral.id === id
                ? {...referral, status: "Accepted"}
                : referral
        ));
    };

    const handleReject = (id) => {
        setIncoming(incoming.filter(referral => referral.id !== id));
    };

    const handleCreateReferral = () => {
        setShowCreateForm(true);
    };

    const handleCancelReferral = () => {
        setShowCreateForm(false);
        setFormData({
            patientName: "",
            age: "",
            receivingHospital: "",
            requiredSpecialty: "",
            currentDiagnosis: "",
            reasonForReferral: "",
            medicalDocuments: null,
        });
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            medicalDocuments: e.target.files[0]
        }));
    };

    const handleSendReferral = (e) => {
        e.preventDefault();
        console.log("Send Referral:", formData);
        // Add API call here
        setShowCreateForm(false);
        setFormData({
            patientName: "",
            age: "",
            receivingHospital: "",
            requiredSpecialty: "",
            currentDiagnosis: "",
            reasonForReferral: "",
            medicalDocuments: null,
        });
    };

    return (
        <div className="dashboard-container">
            <Navigation activePage="referrals"/>

            <div className="referrals-container">
                {/* HEADER */}
                <div className="page-header">
                    <div className="page-title">
                        <h2>Patient Referrals</h2>
                        <p>Manage patient transfers between hospitals</p>
                    </div>
                    <button className="create-btn" onClick={handleCreateReferral}>
                        Create Referral
                    </button>
                </div>

                {/* TABS */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === "incoming" ? "active" : ""}`}
                        onClick={() => setActiveTab("incoming")}
                    >
                        Incoming Referrals ({incoming.length})
                    </button>
                    <button
                        className={`tab ${activeTab === "outgoing" ? "active" : ""}`}
                        onClick={() => setActiveTab("outgoing")}
                    >
                        Outgoing Referrals ({outgoing.length})
                    </button>
                </div>

                {/* CONTENT */}
                <div className="tab-content">
                    {activeTab === "incoming" && (
                        <div className="referrals-list">
                            {incoming.map((referral) => (
                                <div key={referral.id} className="referral-card">
                                    <div className="referral-header">
                                        <div className="patient-info">
                                            <h4>{referral.patient}, {referral.age}</h4>
                                            <span className={`status-badge ${referral.status.toLowerCase()}`}>
                        {referral.status}
                      </span>
                                        </div>
                                        <span className="time">{referral.time}</span>
                                    </div>

                                    <div className="referral-details">
                                        <p><strong>From:</strong> {referral.from}</p>
                                        <p><strong>Condition:</strong> {referral.condition}</p>
                                        <p><strong>Reason:</strong> {referral.reason}</p>
                                        <p className="documents">
                                            <strong>{referral.documents} medical documents attached</strong>
                                            <a href="#" className="view-docs">View Documents</a>
                                        </p>
                                    </div>

                                    {referral.status === "Pending" && (
                                        <div className="referral-actions">
                                            <button className="btn reject" onClick={() => handleReject(referral.id)}>
                                                Reject
                                            </button>
                                            <button className="btn accept" onClick={() => handleAccept(referral.id)}>
                                                Accept Referral
                                            </button>
                                        </div>
                                    )}

                                    {referral.status === "Accepted" && (
                                        <div className="accepted-message">
                                            Referral accepted • Patient transfer scheduled
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "outgoing" && (
                        <div className="referrals-list">
                            {outgoing.map((referral) => (
                                <div key={referral.id} className="referral-card">
                                    <div className="referral-header">
                                        <div className="hospital-info">
                                            <h4>{referral.hospital}</h4>
                                            <span className={`status-badge ${referral.status.toLowerCase()}`}>
                        {referral.status}
                      </span>
                                        </div>
                                    </div>

                                    <div className="referral-details">
                                        <p><strong>Reason:</strong> {referral.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE REFERRAL MODAL */}
            {showCreateForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Create New Referral</h3>
                            <button className="close-btn" onClick={handleCancelReferral}>
                                ×
                            </button>
                        </div>

                        <form className="referral-form" onSubmit={handleSendReferral}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Patient Name</label>
                                    <input
                                        type="text"
                                        value={formData.patientName}
                                        onChange={(e) => handleFormChange("patientName", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Age</label>
                                    <input
                                        type="text"
                                        value={formData.age}
                                        onChange={(e) => handleFormChange("age", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Receiving Hospital</label>
                                    <select
                                        value={formData.receivingHospital}
                                        onChange={(e) => handleFormChange("receivingHospital", e.target.value)}
                                        required
                                    >
                                        <option value="">Select Hospital</option>
                                        <option value="Metro Medical Center">Metro Medical Center</option>
                                        <option value="Community Hospital">Community Hospital</option>
                                        <option value="City Care Hospital">City Care Hospital</option>
                                        <option value="St. Mary's Hospital">St. Mary's Hospital</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Required Specialty</label>
                                    <select
                                        value={formData.requiredSpecialty}
                                        onChange={(e) => handleFormChange("requiredSpecialty", e.target.value)}
                                        required
                                    >
                                        <option value="">Select Specialty</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurosurgery">Neurosurgery</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="General Surgery">General Surgery</option>
                                        <option value="ICU">ICU</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Current Diagnosis</label>
                                <textarea
                                    value={formData.currentDiagnosis}
                                    onChange={(e) => handleFormChange("currentDiagnosis", e.target.value)}
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Reason for Referral</label>
                                <textarea
                                    value={formData.reasonForReferral}
                                    onChange={(e) => handleFormChange("reasonForReferral", e.target.value)}
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload Medical Documents</label>
                                <div className="file-upload">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.doc,.jpg,.png"
                                    />
                                    {formData.medicalDocuments && (
                                        <span className="file-name">{formData.medicalDocuments.name}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn cancel" onClick={handleCancelReferral}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn primary">
                                    Send Referral
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Referrals;
