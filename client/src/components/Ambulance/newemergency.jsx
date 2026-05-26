import React, {useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./ambulance.css";
import "./newemergency.css";

const NewEmergency = () => {
    const {user: authUser} = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "",
        bloodType: "",
        severity: "",
        condition: "",
        diabetic: false,
        hypertensive: false,
    });
    const [patientPhoto, setPatientPhoto] = useState(null);
    const [patientPhotoPreview, setPatientPhotoPreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const uploadInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData({...formData, [name]: type === "checkbox" ? checked : value});
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPatientPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setPatientPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setPatientPhoto(null);
        setPatientPhotoPreview(null);
        if (uploadInputRef.current) uploadInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            chunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: "audio/webm"});
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            setIsRecording(true);
            setRecordingSeconds(0);
            timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
        } catch {
            setError("Microphone access denied. Please allow microphone permission.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        clearInterval(timerRef.current);
        setIsRecording(false);
    };

    const removeAudio = () => {
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setRecordingSeconds(0);
    };

    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            const emergencyData = {
                patient_name: formData.name,
                patient_age: parseInt(formData.age),
                patient_gender: formData.gender,
                blood_type: formData.bloodType,
                condition_description: formData.condition,
                severity: formData.severity,
                is_diabetic: formData.diabetic,
                is_hypertensive: formData.hypertensive,
            };
            const response = await apiService.createEmergency(emergencyData);
            setSuccess(true);
            setTimeout(() => navigate(`/hospital-selection/${response.id}`), 2000);
        } catch (err) {
            setError("Failed to create emergency. Please try again.");
            console.error("Error creating emergency:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const displayName = authUser?.first_name || authUser?.username || "Driver";
    const displayRole = authUser?.role_display || authUser?.role || "Ambulance Driver";

    return (
        <div className="dashboard-container">
            {/* HEADER — matches ambulance dashboard */}
            <div className="top-header">
                <div className="left-section">
                    <div className="logo-section">
                        <img
                            src="/src/assets/rapidcarelogo.png"
                            alt="RapidCare Logo"
                            className="logo"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                            }}
                        />
                        <div className="brand-section">
                            <span className="brand-name">RapidCare</span>
                            <span className="ambulance-unit">New Emergency</span>
                        </div>
                    </div>

                    <div className={`nav-buttons ${isMobileMenuOpen ? "mobile-open" : ""}`}>
                        <button className="nav-btn" onClick={() => handleNavigation("/ambulance")}>Dashboard</button>
                        <button className="nav-btn" onClick={() => handleNavigation("/emergencies")}>Emergencies
                        </button>
                        <button className="nav-btn" onClick={() => handleNavigation("/hospitals")}>Hospitals</button>
                        <button className="nav-btn" onClick={() => handleNavigation("/settings")}>Settings</button>
                    </div>

                    <button className="hamburger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? "✕" : "☰"}
                    </button>
                </div>

                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-avatar">🚑</span>
                        <div className="user-details">
                            <span className="user-name">{displayName}</span>
                            <span className="user-role">{displayRole}</span>
                        </div>
                        <span className="dropdown-arrow">▼</span>
                    </div>
                </div>
            </div>

            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h2>New Emergency</h2>
                    <p>Step 1 of 2 — Patient Information</p>
                </div>
                <div className="ne-steps">
                    <span className="ne-step ne-step-active">1 Patient Details</span>
                    <div className="ne-step-line"/>
                    <span className="ne-step">2 Select Hospital</span>
                </div>
            </div>

            {/* FORM CARD */}
            <div className="ne-card">
                <h3 className="ne-section-title">Patient Information</h3>
                <p className="ne-subtitle">Enter patient details and medical condition</p>

                <div className="ne-form-grid">
                    <div className="ne-field">
                        <label className="ne-label">Patient Name</label>
                        <input className="ne-input" type="text" name="name" placeholder="Enter patient name"
                               onChange={handleChange}/>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Age</label>
                        <input className="ne-input" type="number" name="age" placeholder="Enter age"
                               onChange={handleChange}/>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Gender</label>
                        <select className="ne-input" name="gender" onChange={handleChange}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Blood Type</label>
                        <select className="ne-input" name="bloodType" onChange={handleChange}>
                            <option value="">Select blood type</option>
                            <option>A+</option>
                            <option>A-</option>
                            <option>B+</option>
                            <option>B-</option>
                            <option>O+</option>
                            <option>O-</option>
                            <option>AB+</option>
                            <option>AB-</option>
                        </select>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Severity</label>
                        <select className="ne-input" name="severity" onChange={handleChange}>
                            <option value="">Select severity</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                <div className="ne-field" style={{marginTop: "16px"}}>
                    <label className="ne-label">Condition Description</label>
                    <textarea
                        className="ne-input ne-textarea"
                        name="condition"
                        placeholder="Describe the patient's condition (e.g., chest pain, breathing difficulty, trauma...)"
                        onChange={handleChange}
                    />
                </div>

                {/* PATIENT PHOTO */}
                <div className="ne-field" style={{marginTop: "16px"}}>
                    <label className="ne-label">Patient Photo (Optional)</label>
                    <div className="ne-photo-area">
                        {patientPhotoPreview ? (
                            <div className="ne-photo-preview">
                                <img src={patientPhotoPreview} alt="Patient" className="ne-photo-img"/>
                                <button type="button" className="ne-photo-remove" onClick={removePhoto}>✕ Remove
                                </button>
                            </div>
                        ) : (
                            <div className="ne-photo-actions">
                                <button
                                    type="button"
                                    className="ne-photo-btn"
                                    onClick={() => uploadInputRef.current?.click()}
                                >
                                    📁 Upload Photo
                                </button>
                                <button
                                    type="button"
                                    className="ne-photo-btn"
                                    onClick={() => cameraInputRef.current?.click()}
                                >
                                    📷 Take Photo
                                </button>
                            </div>
                        )}
                    </div>
                    {/* hidden inputs */}
                    <input
                        ref={uploadInputRef}
                        type="file"
                        accept="image/*"
                        style={{display: "none"}}
                        onChange={handlePhotoSelect}
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{display: "none"}}
                        onChange={handlePhotoSelect}
                    />
                </div>

                {/* VOICE NOTE */}
                <div className="ne-field" style={{marginTop: "16px"}}>
                    <label className="ne-label">Voice Note (Optional)</label>
                    <div className="ne-photo-area">
                        {audioUrl ? (
                            <div className="ne-audio-preview">
                                <audio controls src={audioUrl} className="ne-audio-player"/>
                                <button type="button" className="ne-photo-remove" onClick={removeAudio}>✕ Remove
                                </button>
                            </div>
                        ) : isRecording ? (
                            <div className="ne-recording-active">
                                <span className="ne-rec-dot"/>
                                <span className="ne-rec-label">Recording {fmtTime(recordingSeconds)}</span>
                                <button type="button" className="ne-photo-btn ne-stop-btn" onClick={stopRecording}>⏹
                                    Stop
                                </button>
                            </div>
                        ) : (
                            <button type="button" className="ne-photo-btn" style={{width: "100%"}}
                                    onClick={startRecording}>
                                🎤 Record Voice Note
                            </button>
                        )}
                    </div>
                </div>

                {/* MEDICAL FLAGS */}
                <div className="ne-health">
                    <label className="ne-checkbox-label">
                        <input type="checkbox" name="diabetic" onChange={handleChange}/>
                        Diabetic
                    </label>
                    <label className="ne-checkbox-label">
                        <input type="checkbox" name="hypertensive" onChange={handleChange}/>
                        Hypertensive
                    </label>
                </div>

                {error && <div className="ne-error">{error}</div>}
                {success && <div className="ne-success">Emergency created successfully! Redirecting to hospital
                    selection...</div>}

                <button className="ne-submit-btn" onClick={handleSubmit} disabled={loading || success}>
                    {loading ? "Creating Emergency..." : success ? "Created!" : "Continue to Hospital Selection →"}
                </button>
            </div>
        </div>
    );
};

export default NewEmergency;
