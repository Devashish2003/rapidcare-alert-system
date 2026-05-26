import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import {useOnlineStatus} from "../../hooks/useOnlineStatus";
import {useOfflineQueue} from "../../hooks/useOfflineQueue";
import {
    saveDraft, loadDraft, clearDraft,
    saveVoiceBlob, loadVoiceBlob, clearVoiceBlob,
} from "../../utils/db";
import AmbulanceHeader from "./AmbulanceHeader";
import "./ambulance.css";
import "./newemergency.css";

const EMPTY_FORM = {
    name: "", age: "", gender: "", bloodType: "",
    severity: "", condition: "", diabetic: false, hypertensive: false,
};

const NewEmergency = () => {
    const {user: authUser} = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [draftRestored, setDraftRestored] = useState(false);

    const [patientPhoto, setPatientPhoto] = useState(null);
    const [patientPhotoPreview, setPatientPhotoPreview] = useState(null);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingSeconds, setRecordingSeconds] = useState(0);

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [offlineQueued, setOfflineQueued] = useState(false);

    const uploadInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    // ── Restore draft on mount ───────────────────────────────────────────────
    useEffect(() => {
        const restore = async () => {
            const draft = await loadDraft();
            if (draft) {
                const {savedAt, id, ...formFields} = draft;
                setFormData(formFields);
                setDraftRestored(true);
            }
            const blob = await loadVoiceBlob();
            if (blob) {
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            }
        };
        restore();
    }, []);

    // ── Auto-save draft on every form change ─────────────────────────────────
    useEffect(() => {
        saveDraft(formData).catch(() => {
        });
    }, [formData]);

    // ── Auto-save voice blob to IndexedDB ────────────────────────────────────
    useEffect(() => {
        if (audioBlob) {
            saveVoiceBlob(audioBlob).catch(() => {
            });
        }
    }, [audioBlob]);

    // ── When back online, attempt to retry if previously queued ─────────────
    useOfflineQueue((results) => {
        if (results.length > 0 && offlineQueued) {
            // Emergency was queued; navigate to dashboard since we don't have the id
            setOfflineQueued(false);
            setSuccess(true);
            setTimeout(() => navigate('/ambulance'), 2000);
        }
    });

    // ── Form handlers ────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData(prev => ({...prev, [name]: type === "checkbox" ? checked : value}));
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

    // ── Voice recording ──────────────────────────────────────────────────────
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
        clearVoiceBlob().catch(() => {
        });
    };

    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!formData.name || !formData.age || !formData.gender || !formData.severity || !formData.condition) {
            setError("Please fill in all required fields (name, age, gender, severity, condition).");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setUploadProgress(null);

            // Step 1: Create the emergency record
            const emergency = await apiService.createEmergency({
                patient_name: formData.name,
                patient_age: parseInt(formData.age),
                patient_gender: formData.gender,
                blood_type: formData.bloodType,
                condition_description: formData.condition,
                severity: formData.severity,
                is_diabetic: formData.diabetic,
                is_hypertensive: formData.hypertensive,
            });

            // Step 2: Upload voice note if recorded
            if (audioBlob) {
                const audioFile = new File([audioBlob], 'voice_note.webm', {type: 'audio/webm'});
                setUploadProgress('Uploading voice note...');
                await apiService.uploadFile(
                    audioFile,
                    'voice_note',
                    {emergencyId: emergency.id},
                    (pct) => setUploadProgress(`Uploading voice note... ${pct}%`),
                );
            }

            // Step 3: Upload patient photo if captured
            if (patientPhoto) {
                setUploadProgress('Uploading patient photo...');
                await apiService.uploadFile(
                    patientPhoto,
                    'patient_photo',
                    {emergencyId: emergency.id},
                    (pct) => setUploadProgress(`Uploading photo... ${pct}%`),
                );
            }

            // Clear draft on success
            await clearDraft();
            await clearVoiceBlob();

            setUploadProgress(null);
            setSuccess(true);
            setTimeout(() => navigate(`/hospital-selection/${emergency.id}`), 1500);
        } catch (err) {
            if (err.isOfflineQueued) {
                // Request was queued — inform user and stay on page
                setOfflineQueued(true);
                setError(null);
            } else {
                setError(err?.response?.data?.detail || "Failed to create emergency. Please try again.");
                console.error("Error creating emergency:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="dashboard-container">
            <AmbulanceHeader activePath="/new-emergency"/>

            {/* Offline banner */}
            {!isOnline && (
                <div style={{
                    background: '#fef3c7', color: '#92400e', padding: '10px 20px',
                    fontSize: '13px', textAlign: 'center', borderBottom: '1px solid #fcd34d',
                }}>
                    You are offline. Your form data and voice note are saved locally. Submit when connected and the
                    request will be sent automatically.
                </div>
            )}

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

            {/* Draft restored notice */}
            {draftRestored && (
                <div style={{
                    margin: '0 20px 12px', padding: '8px 14px', background: '#eff6ff',
                    color: '#1d4ed8', borderRadius: '6px', fontSize: '13px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span>Draft restored from your last session.</span>
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#1d4ed8',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textDecoration: 'underline'
                        }}
                        onClick={async () => {
                            await clearDraft();
                            await clearVoiceBlob();
                            setFormData(EMPTY_FORM);
                            removeAudio();
                            setDraftRestored(false);
                        }}
                    >
                        Clear draft
                    </button>
                </div>
            )}

            {/* FORM CARD */}
            <div className="ne-card">
                <h3 className="ne-section-title">Patient Information</h3>
                <p className="ne-subtitle">Enter patient details and medical condition</p>

                <div className="ne-form-grid">
                    <div className="ne-field">
                        <label className="ne-label">Patient Name</label>
                        <input className="ne-input" type="text" name="name" placeholder="Enter patient name"
                               value={formData.name} onChange={handleChange}/>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Age</label>
                        <input className="ne-input" type="number" name="age" placeholder="Enter age"
                               value={formData.age} onChange={handleChange}/>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Gender</label>
                        <select className="ne-input" name="gender" value={formData.gender} onChange={handleChange}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="ne-field">
                        <label className="ne-label">Blood Type</label>
                        <select className="ne-input" name="bloodType" value={formData.bloodType}
                                onChange={handleChange}>
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
                        <select className="ne-input" name="severity" value={formData.severity} onChange={handleChange}>
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
                        value={formData.condition}
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
                                <button type="button" className="ne-photo-btn"
                                        onClick={() => uploadInputRef.current?.click()}>
                                    📁 Upload Photo
                                </button>
                                <button type="button" className="ne-photo-btn"
                                        onClick={() => cameraInputRef.current?.click()}>
                                    📷 Take Photo
                                </button>
                            </div>
                        )}
                    </div>
                    <input ref={uploadInputRef} type="file" accept="image/*" style={{display: "none"}}
                           onChange={handlePhotoSelect}/>
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                           style={{display: "none"}} onChange={handlePhotoSelect}/>
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
                                <button type="button" className="ne-photo-btn ne-stop-btn"
                                        onClick={stopRecording}>⏹ Stop
                                </button>
                            </div>
                        ) : (
                            <button type="button" className="ne-photo-btn" style={{width: "100%"}}
                                    onClick={startRecording}>
                                🎤 Record Voice Note
                            </button>
                        )}
                    </div>
                    {!isOnline && audioBlob && (
                        <p style={{fontSize: '12px', color: '#92400e', marginTop: '4px'}}>
                            Voice note saved locally — will upload when back online.
                        </p>
                    )}
                </div>

                {/* MEDICAL FLAGS */}
                <div className="ne-health">
                    <label className="ne-checkbox-label">
                        <input type="checkbox" name="diabetic" checked={formData.diabetic} onChange={handleChange}/>
                        Diabetic
                    </label>
                    <label className="ne-checkbox-label">
                        <input type="checkbox" name="hypertensive" checked={formData.hypertensive}
                               onChange={handleChange}/>
                        Hypertensive
                    </label>
                </div>

                {error && <div className="ne-error">{error}</div>}

                {offlineQueued && (
                    <div className="ne-success"
                         style={{background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d'}}>
                        You are offline. Your emergency has been queued and will be submitted automatically when your
                        connection is restored.
                    </div>
                )}

                {uploadProgress && !success && (
                    <div className="ne-success"
                         style={{background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe'}}>
                        ⏫ {uploadProgress}
                    </div>
                )}
                {success && <div className="ne-success">Emergency created! Redirecting to hospital selection...</div>}

                <button className="ne-submit-btn" onClick={handleSubmit}
                        disabled={loading || success || offlineQueued}>
                    {loading
                        ? (uploadProgress ? "Uploading files..." : "Creating Emergency...")
                        : success ? "Created!"
                            : offlineQueued ? "Queued — waiting for connection..."
                                : "Continue to Hospital Selection →"}
                </button>
            </div>
        </div>
    );
};

export default NewEmergency;
