import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./referrals.css";
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
                <button className="nav-btn" onClick={() => navigate('/availability')}>Availability</button>
                <button className="nav-btn active" onClick={() => navigate('/referrals')}>Referrals</button>
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

const Referrals = () => {
    const {user} = useAuth();
    const [activeTab, setActiveTab] = useState("incoming");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        patient_name: "",
        patient_age: "",
        receiving_hospital_id: "",
        required_specialty: "",
        current_diagnosis: "",
        reason_for_referral: "",
    });
    const [docFiles, setDocFiles] = useState([]);       // File[] selected for upload
    const [uploadProgress, setUploadProgress] = useState(null);

    const hospitalId = user?.profile?.hospital_id;

    useEffect(() => {
        if (hospitalId) {
            fetchData();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hospitalId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [incomingData, outgoingData, hospitalsData] = await Promise.all([
                apiService.getPatientReferrals(hospitalId, 'incoming'),
                apiService.getPatientReferrals(hospitalId, 'outgoing'),
                apiService.getHospitals(),
            ]);
            setIncoming(Array.isArray(incomingData) ? incomingData : incomingData.results || []);
            setOutgoing(Array.isArray(outgoingData) ? outgoingData : outgoingData.results || []);
            setHospitals(Array.isArray(hospitalsData) ? hospitalsData : hospitalsData.results || []);
        } catch (err) {
            console.error('Error fetching referrals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            const updated = await apiService.acceptReferral(id);
            setIncoming(incoming.map(r => r.id === id ? updated : r));
        } catch (err) {
            console.error('Error accepting referral:', err);
        }
    };

    const handleReject = async (id) => {
        try {
            const updated = await apiService.rejectReferral(id);
            setIncoming(incoming.map(r => r.id === id ? updated : r));
        } catch (err) {
            console.error('Error rejecting referral:', err);
        }
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleDocFiles = (e) => {
        setDocFiles(Array.from(e.target.files));
    };

    const handleSendReferral = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setUploadProgress(null);

            // Step 1: create referral record
            const referral = await apiService.createReferral({
                ...formData,
                patient_age: parseInt(formData.patient_age),
                referring_hospital_id: hospitalId,
            });

            // Step 2: upload each medical document
            for (let i = 0; i < docFiles.length; i++) {
                setUploadProgress(`Uploading document ${i + 1} of ${docFiles.length}...`);
                await apiService.uploadFile(
                    docFiles[i],
                    'medical_document',
                    {referralId: referral.id},
                );
            }

            setUploadProgress(null);
            setShowCreateForm(false);
            setDocFiles([]);
            setFormData({
                patient_name: "", patient_age: "", receiving_hospital_id: "",
                required_specialty: "", current_diagnosis: "", reason_for_referral: "",
            });
            fetchData();
        } catch (err) {
            console.error('Error creating referral:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    return (
        <div className="dashboard-container">
            <Navigation/>

            <div className="referrals-container">
                <div className="page-header">
                    <div className="page-title">
                        <h2>Patient Referrals</h2>
                        <p>Manage patient transfers between hospitals</p>
                    </div>
                    {hospitalId && (
                        <button className="create-btn" onClick={() => setShowCreateForm(true)}>
                            Create Referral
                        </button>
                    )}
                </div>

                {!hospitalId && (
                    <p style={{color: '#dc2626', padding: '1rem'}}>No hospital assigned to your profile.</p>
                )}

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

                <div className="tab-content">
                    {activeTab === "incoming" && (
                        <div className="referrals-list">
                            {incoming.length === 0 && <p style={{color: '#6b7280'}}>No incoming referrals.</p>}
                            {incoming.map((referral) => (
                                <div key={referral.id} className="referral-card">
                                    <div className="referral-header">
                                        <div className="patient-info">
                                            <h4>{referral.patient_name}, {referral.patient_age}</h4>
                                            <span className={`status-badge ${referral.status?.toLowerCase()}`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                        <span className="time">{referral.created_at ? new Date(referral.created_at).toLocaleString() : ''}</span>
                                    </div>

                                    <div className="referral-details">
                                        <p><strong>From:</strong> {referral.referring_hospital_name}</p>
                                        <p><strong>Condition:</strong> {referral.current_diagnosis}</p>
                                        <p><strong>Reason:</strong> {referral.reason_for_referral}</p>
                                        <p><strong>Specialty needed:</strong> {referral.required_specialty}</p>
                                        {referral.attachments?.length > 0 ? (
                                            <div className="documents">
                                                <strong>📎 {referral.attachments.length} document{referral.attachments.length > 1 ? 's' : ''} attached</strong>
                                                <div style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '6px',
                                                    marginTop: '4px'
                                                }}>
                                                    {referral.attachments.map(doc => (
                                                        <a key={doc.id} href={doc.file_url} target="_blank"
                                                           rel="noreferrer"
                                                           style={{
                                                               fontSize: '12px',
                                                               color: '#2563eb',
                                                               textDecoration: 'underline'
                                                           }}>
                                                            {doc.original_name}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : referral.documents_count > 0 ? (
                                            <p className="documents">
                                                <strong>📎 {referral.documents_count} document{referral.documents_count > 1 ? 's' : ''} attached</strong>
                                            </p>
                                        ) : null}
                                    </div>

                                    {referral.status === "pending" && (
                                        <div className="referral-actions">
                                            <button className="btn reject" onClick={() => handleReject(referral.id)}>Reject</button>
                                            <button className="btn accept" onClick={() => handleAccept(referral.id)}>Accept Referral</button>
                                        </div>
                                    )}

                                    {referral.status === "accepted" && (
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
                            {outgoing.length === 0 && <p style={{color: '#6b7280'}}>No outgoing referrals.</p>}
                            {outgoing.map((referral) => (
                                <div key={referral.id} className="referral-card">
                                    <div className="referral-header">
                                        <div className="hospital-info">
                                            <h4>{referral.receiving_hospital_name}</h4>
                                            <span className={`status-badge ${referral.status?.toLowerCase()}`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="referral-details">
                                        <p><strong>Patient:</strong> {referral.patient_name}</p>
                                        <p><strong>Reason:</strong> {referral.reason_for_referral}</p>
                                        <p><strong>Specialty:</strong> {referral.required_specialty}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreateForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Create New Referral</h3>
                            <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
                        </div>

                        <form className="referral-form" onSubmit={handleSendReferral}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Patient Name</label>
                                    <input
                                        type="text"
                                        value={formData.patient_name}
                                        onChange={(e) => handleFormChange("patient_name", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        value={formData.patient_age}
                                        onChange={(e) => handleFormChange("patient_age", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Receiving Hospital</label>
                                    <select
                                        value={formData.receiving_hospital_id}
                                        onChange={(e) => handleFormChange("receiving_hospital_id", e.target.value)}
                                        required
                                    >
                                        <option value="">Select Hospital</option>
                                        {hospitals.filter(h => h.id !== hospitalId).map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Required Specialty</label>
                                    <select
                                        value={formData.required_specialty}
                                        onChange={(e) => handleFormChange("required_specialty", e.target.value)}
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
                                    value={formData.current_diagnosis}
                                    onChange={(e) => handleFormChange("current_diagnosis", e.target.value)}
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Reason for Referral</label>
                                <textarea
                                    value={formData.reason_for_referral}
                                    onChange={(e) => handleFormChange("reason_for_referral", e.target.value)}
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Medical Documents (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,image/jpeg,image/png,image/jpg"
                                    onChange={handleDocFiles}
                                    style={{padding: '6px 0'}}
                                />
                                {docFiles.length > 0 && (
                                    <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
                                        {docFiles.length} file{docFiles.length > 1 ? 's' : ''} selected
                                        ({docFiles.map(f => f.name).join(', ')})
                                    </p>
                                )}
                            </div>

                            {uploadProgress && (
                                <div style={{
                                    padding: '8px 12px', background: '#eff6ff', color: '#1d4ed8',
                                    borderRadius: '6px', fontSize: '13px', marginBottom: '8px'
                                }}>
                                    ⏫ {uploadProgress}
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="btn cancel" onClick={() => setShowCreateForm(false)}>Cancel</button>
                                <button type="submit" className="btn primary" disabled={submitting}>
                                    {submitting ? (uploadProgress ? 'Uploading...' : 'Sending...') : 'Send Referral'}
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
