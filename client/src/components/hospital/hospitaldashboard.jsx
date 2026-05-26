import React, {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import "./hospitaldashboard.css";

const DEPT_PRESETS = [
    'ICU', 'Emergency', 'Cardiology', 'Orthopedics', 'Ophthalmology',
    'Neurology', 'Pediatrics', 'Gynecology', 'General Surgery', 'Radiology',
    'Pathology', 'Pharmacy', 'Blood Bank', 'Oncology', 'Dermatology',
    'Psychiatry', 'ENT', 'Dentistry', 'Nephrology', 'Urology',
];

const BLOOD_STYLES = {
    'A+':  {color: '#dc2626', bg: '#fee2e2', border: '#fca5a5'},
    'A-':  {color: '#b91c1c', bg: '#fecaca', border: '#f87171'},
    'B+':  {color: '#d97706', bg: '#fef3c7', border: '#fcd34d'},
    'B-':  {color: '#b45309', bg: '#fde68a', border: '#f59e0b'},
    'O+':  {color: '#059669', bg: '#d1fae5', border: '#6ee7b7'},
    'O-':  {color: '#047857', bg: '#a7f3d0', border: '#34d399'},
    'AB+': {color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd'},
    'AB-': {color: '#6d28d9', bg: '#ddd6fe', border: '#a78bfa'},
};

const EQUIP_ICONS = {
    ventilators: '🫁', defibrillators: '⚡', ct: '🔬', mri: '🧲',
    xray: '☢️', dialysis: '💧', icu_monitor: '📊', ecg: '❤️',
    ultrasound: '📡', incubator: '👶', pulse_oximeter: '🩺',
    infusion_pump: '💉', cardiac_monitor: '💓', oxygen_concentrator: '🫧',
    surgical_lights: '💡',
};

const TABS = [
    {id: 'overview',    label: '📊 Overview'},
    {id: 'departments', label: '🏥 Departments'},
    {id: 'blood',       label: '🩸 Blood Bank'},
    {id: 'equipment',   label: '🔧 Equipment'},
    {id: 'profile',     label: '⚙️ Profile'},
];

const EMPTY_DEPT = {name: '', total_beds: 0, available_beds: 0, doctors_on_duty: 0};

const HospitalDashboard = () => {
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const hospitalId = user?.profile?.hospital_id;

    const [activeTab, setActiveTab]         = useState('overview');
    const [toast, setToast]                 = useState(null);
    const [setupLoading, setSetupLoading]   = useState(false);

    // Overview
    const [stats, setStats]                 = useState({active_alerts:0,available_beds:0,doctors_on_duty:0,todays_emergencies:0,high_priority_alerts:0,medium_priority_alerts:0,low_priority_alerts:0});
    const [recentAlerts, setRecentAlerts]   = useState([]);
    const [overviewLoading, setOverviewLoading] = useState(true);

    // Departments
    const [departments, setDepartments]     = useState([]);
    const [deptsLoading, setDeptsLoading]   = useState(false);
    const [editingDept, setEditingDept]     = useState(null);
    const [showAddDept, setShowAddDept]     = useState(false);
    const [newDept, setNewDept]             = useState(EMPTY_DEPT);
    const [deptSaving, setDeptSaving]       = useState(false);

    // Blood bank
    const [bloodInventory, setBloodInventory] = useState([]);
    const [bloodLoading, setBloodLoading]     = useState(false);
    const [bloodEdits, setBloodEdits]         = useState({});
    const [bloodSaving, setBloodSaving]       = useState(null);

    // Equipment
    const [equipment, setEquipment]         = useState([]);
    const [equipLoading, setEquipLoading]   = useState(false);
    const [editingEquip, setEditingEquip]   = useState(null);
    const [equipSaving, setEquipSaving]     = useState(false);

    // Profile
    const [profileForm, setProfileForm]     = useState({name:'',address:'',phone:'',email:'',emergency_contact:'',bed_capacity:0});
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving]   = useState(false);
    const [profileSaved, setProfileSaved]     = useState(false);

    const showToast = (type, msg) => {
        setToast({type, msg});
        setTimeout(() => setToast(null), 3000);
    };

    const loadOverview = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setOverviewLoading(true);
            const [s, a] = await Promise.all([
                apiService.getHospitalDashboardStats(hospitalId),
                apiService.getRecentAlerts(hospitalId),
            ]);
            setStats(s);
            setRecentAlerts(Array.isArray(a) ? a : a.results || []);
        } catch (e) { console.error(e); }
        finally { setOverviewLoading(false); }
    }, [hospitalId]);

    const loadDepartments = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setDeptsLoading(true);
            const data = await apiService.getDepartments(hospitalId);
            setDepartments(Array.isArray(data) ? data : data.results || []);
        } catch (e) { console.error(e); }
        finally { setDeptsLoading(false); }
    }, [hospitalId]);

    const loadBlood = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setBloodLoading(true);
            const data = await apiService.getBloodInventory(hospitalId);
            const list = Array.isArray(data) ? data : data.results || [];
            setBloodInventory(list);
            const edits = {};
            list.forEach(b => { edits[b.id] = b.units_available; });
            setBloodEdits(edits);
        } catch (e) { console.error(e); }
        finally { setBloodLoading(false); }
    }, [hospitalId]);

    const loadEquipment = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setEquipLoading(true);
            const data = await apiService.getEquipment(hospitalId);
            setEquipment(Array.isArray(data) ? data : data.results || []);
        } catch (e) { console.error(e); }
        finally { setEquipLoading(false); }
    }, [hospitalId]);

    const loadProfile = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setProfileLoading(true);
            const data = await apiService.getHospital(hospitalId);
            setProfileForm({
                name: data.name||'', address: data.address||'',
                phone: data.phone||'', email: data.email||'',
                emergency_contact: data.emergency_contact||'',
                bed_capacity: data.bed_capacity||0,
            });
        } catch (e) { console.error(e); }
        finally { setProfileLoading(false); }
    }, [hospitalId]);

    useEffect(() => { if (hospitalId) loadOverview(); }, [hospitalId, loadOverview]);

    useEffect(() => {
        if (!hospitalId) return;
        if (activeTab === 'departments') loadDepartments();
        else if (activeTab === 'blood')      loadBlood();
        else if (activeTab === 'equipment')  loadEquipment();
        else if (activeTab === 'profile')    loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, hospitalId]);

    const handleSetupDefaults = async () => {
        try {
            setSetupLoading(true);
            await apiService.setupHospitalDefaults(hospitalId);
            showToast('success', 'Defaults initialized!');
            if (activeTab === 'blood')       loadBlood();
            if (activeTab === 'equipment')   loadEquipment();
            if (activeTab === 'departments') loadDepartments();
        } catch {
            showToast('error', 'Failed to initialize defaults.');
        }
        finally { setSetupLoading(false); }
    };

    // — Department actions —
    const saveDeptEdit = async () => {
        if (!editingDept) return;
        try {
            setDeptSaving(true);
            const updated = await apiService.updateDepartment(editingDept.id, {
                name: editingDept.name,
                total_beds: parseInt(editingDept.total_beds) || 0,
                available_beds: parseInt(editingDept.available_beds) || 0,
                doctors_on_duty: parseInt(editingDept.doctors_on_duty) || 0,
                is_active: editingDept.is_active,
            });
            setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
            setEditingDept(null);
            showToast('success', 'Department saved.');
        } catch {
            showToast('error', 'Failed to save department.');
        }
        finally { setDeptSaving(false); }
    };

    const addDepartment = async () => {
        if (!newDept.name.trim()) { showToast('error', 'Please select or enter a department name.'); return; }
        try {
            setDeptSaving(true);
            const created = await apiService.createDepartment({
                hospital: hospitalId,
                name: newDept.name,
                total_beds: parseInt(newDept.total_beds) || 0,
                available_beds: parseInt(newDept.available_beds) || 0,
                doctors_on_duty: parseInt(newDept.doctors_on_duty) || 0,
                is_active: true,
            });
            setDepartments(prev => [...prev, created]);
            setShowAddDept(false);
            setNewDept(EMPTY_DEPT);
            showToast('success', 'Department added.');
        } catch {
            showToast('error', 'Failed to add department.');
        }
        finally { setDeptSaving(false); }
    };

    const deleteDept = async (id) => {
        if (!window.confirm('Delete this department?')) return;
        try {
            await apiService.deleteDepartment(id);
            setDepartments(prev => prev.filter(d => d.id !== id));
            showToast('success', 'Department deleted.');
        } catch {
            showToast('error', 'Failed to delete.');
        }
    };

    // — Blood actions —
    const saveBlood = async (id) => {
        try {
            setBloodSaving(id);
            const updated = await apiService.updateBloodInventory(id, {units_available: parseInt(bloodEdits[id]) || 0});
            setBloodInventory(prev => prev.map(b => b.id === id ? updated : b));
            showToast('success', 'Blood inventory updated.');
        } catch {
            showToast('error', 'Failed to update.');
        }
        finally { setBloodSaving(null); }
    };

    // — Equipment actions —
    const toggleEquip = async (id, current) => {
        try {
            const updated = await apiService.toggleEquipment(id, !current);
            setEquipment(prev => prev.map(e => e.id === id ? updated : e));
            showToast('success', `Marked ${!current ? 'available' : 'unavailable'}.`);
        } catch {
            showToast('error', 'Failed to toggle.');
        }
    };

    const saveEquipEdit = async () => {
        if (!editingEquip) return;
        try {
            setEquipSaving(true);
            const updated = await apiService.updateEquipment(editingEquip.id, {
                total_count: parseInt(editingEquip.total_count) || 1,
                available_count: parseInt(editingEquip.available_count) || 0,
            });
            setEquipment(prev => prev.map(e => e.id === updated.id ? updated : e));
            setEditingEquip(null);
            showToast('success', 'Equipment updated.');
        } catch {
            showToast('error', 'Failed to update.');
        }
        finally { setEquipSaving(false); }
    };

    // — Profile actions —
    const saveProfile = async () => {
        try {
            setProfileSaving(true);
            await apiService.updateHospital(hospitalId, profileForm);
            showToast('success', 'Profile saved.');
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2500);
        } catch {
            showToast('error', 'Failed to save profile.');
        }
        finally { setProfileSaving(false); }
    };

    if (!hospitalId) {
        return (
            <div className="dashboard-container" style={{display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'8px'}}>
                <p style={{color:'#dc2626',fontSize:'18px',fontWeight:600}}>No hospital assigned to your account.</p>
                <p style={{color:'#6b7280'}}>Contact your administrator to link your account to a hospital.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            {/* ── FIXED TOAST ── */}
            {toast && <div className={`hd-toast hd-toast-${toast.type}`}>{toast.msg}</div>}

            {/* ── STICKY HEADER (branding row + tab row combined) ── */}
            <div className="top-header hd-header">

                {/* Row 1: Logo | External nav | User */}
                <div className="hd-top-row">
                    <div className="hd-logo-group">
                        <img src="/src/assets/rapidcarelogo.png" alt="RapidCare" className="logo"
                             onError={e => { e.target.style.display='none'; }}/>
                        <div className="brand-section">
                            <span className="brand-name">RapidCare</span>
                            <span className="hospital-name">Hospital Portal</span>
                        </div>
                    </div>

                    <div className="hd-ext-nav">
                        <button className="nav-btn" onClick={() => navigate('/alerts')}>🚨 Alerts</button>
                        <button className="nav-btn" onClick={() => navigate('/referrals')}>📋 Referrals</button>
                        <button className="nav-btn" onClick={() => navigate('/hospitals')}>🔍 Hospitals</button>
                        <button className="nav-btn" onClick={() => navigate('/hospital-settings')}>⚙️ Settings</button>
                    </div>

                    {user && (
                        <div className="hd-user-chip">
                            <span className="hd-avatar">👩‍⚕️</span>
                            <div className="user-details">
                                <span className="user-name">{user.first_name || user.username}</span>
                                <span className="user-role">{user.role_display || user.role}</span>
                            </div>
                            <button className="hd-signout" onClick={() => { logout(); navigate('/login'); }}>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 2: Management tabs */}
                <div className="hd-tab-row">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`hd-tab-btn ${activeTab === tab.id ? 'hd-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >{tab.label}</button>
                    ))}
                </div>
            </div>

            {/* ── PAGE CONTENT ── */}
            <div className="hd-content">

                {/* ═══════ OVERVIEW ═══════ */}
                {activeTab === 'overview' && (
                    overviewLoading
                        ? <div className="hd-loading"><div className="spinner"/>Loading...</div>
                        : <>
                            <div className="stats-grid">
                                <div className="card stats-card">
                                    <div className="stats-icon">🚨</div>
                                    <h4>Active Alerts</h4>
                                    <h2>{stats.active_alerts}</h2>
                                    <div className="hd-pill-row">
                                        <span className="hd-pill hd-pill-red">{stats.high_priority_alerts} High</span>
                                        <span className="hd-pill hd-pill-orange">{stats.medium_priority_alerts} Med</span>
                                        <span className="hd-pill hd-pill-gray">{stats.low_priority_alerts} Low</span>
                                    </div>
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

                            <div className="section">
                                <div className="section-header">
                                    <h3>Recent Emergency Alerts</h3>
                                    <button className="btn" onClick={() => navigate('/alerts')}>View All</button>
                                </div>
                                <div className="alert-list">
                                    {recentAlerts.length === 0
                                        ? <div className="hd-empty-sm">No recent alerts — all clear ✅</div>
                                        : recentAlerts.map(alert => (
                                            <div key={alert.id} className={`alert ${alert.priority}`}>
                                                <div>
                                                    <strong>{alert.patient_name}, {alert.patient_age}{alert.patient_gender?.[0]}</strong>
                                                    <p>{alert.case_description}</p>
                                                    <small>ETA: {alert.eta} · Ambulance: {alert.ambulance_id}</small>
                                                </div>
                                                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px'}}>
                                                    <span className={`hd-pr-badge hd-pr-${alert.priority}`}>{alert.priority?.toUpperCase()}</span>
                                                    <span className="badge gray">{alert.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            <div className="bottom-grid">
                                <div className="card">
                                    <h3>Quick Actions</h3>
                                    <button className="action-btn" onClick={() => setActiveTab('departments')}>Manage Departments</button>
                                    <button className="action-btn" onClick={() => setActiveTab('blood')}>Update Blood Bank</button>
                                    <button className="action-btn" onClick={() => setActiveTab('equipment')}>Manage Equipment</button>
                                    <button className="action-btn" onClick={() => navigate('/referrals')}>Patient Referrals</button>
                                </div>
                                <div className="card system-status">
                                    <h3>System Status</h3>
                                    <p>Real-time Alerts <span className="status active">Active</span></p>
                                    <p>Network <span className="status active">Online</span></p>
                                    <p>Hospital ID <span style={{color:'#dc2626',fontWeight:700}}>#{hospitalId}</span></p>
                                </div>
                            </div>
                        </>
                )}

                {/* ═══════ DEPARTMENTS ═══════ */}
                {activeTab === 'departments' && (
                    <>
                        <div className="hd-section-head">
                            <div>
                                <h2 className="hd-section-title">Department Management</h2>
                                <p className="hd-section-sub">Manage bed availability and staffing by department</p>
                            </div>
                            <div className="hd-head-actions">
                                <button className="hd-btn-ghost" onClick={handleSetupDefaults} disabled={setupLoading}>
                                    {setupLoading ? 'Working…' : '⚡ Setup Defaults'}
                                </button>
                                <button className="hd-btn-primary" onClick={() => { setShowAddDept(v => !v); setEditingDept(null); }}>
                                    {showAddDept ? '✕ Cancel' : '+ Add Department'}
                                </button>
                            </div>
                        </div>

                        {/* Add-department panel */}
                        {showAddDept && (
                            <div className="card hd-add-panel">
                                <h4 className="hd-add-panel-title">Select Department Type</h4>

                                {/* Preset chips */}
                                <div className="hd-preset-grid">
                                    {DEPT_PRESETS.map(name => (
                                        <button
                                            key={name}
                                            className={`hd-preset-chip ${newDept.name === name ? 'hd-preset-selected' : ''}`}
                                            onClick={() => setNewDept(p => ({...p, name}))}
                                        >{name}</button>
                                    ))}
                                </div>

                                <div className="hd-custom-name-row">
                                    <span className="hd-or-label">or type custom name</span>
                                    <input
                                        type="text"
                                        className="hd-custom-input"
                                        placeholder="Custom department name…"
                                        value={newDept.name}
                                        onChange={e => setNewDept(p => ({...p, name: e.target.value}))}
                                    />
                                </div>

                                {newDept.name && (
                                    <>
                                        <div className="hd-selected-name">
                                            Adding: <strong>{newDept.name}</strong>
                                        </div>
                                        <div className="hd-form-row">
                                            <div className="hd-field">
                                                <label>Total Beds</label>
                                                <input type="number" min="0" value={newDept.total_beds}
                                                       onChange={e => setNewDept(p => ({...p, total_beds: e.target.value}))}/>
                                            </div>
                                            <div className="hd-field">
                                                <label>Available Beds</label>
                                                <input type="number" min="0" value={newDept.available_beds}
                                                       onChange={e => setNewDept(p => ({...p, available_beds: e.target.value}))}/>
                                            </div>
                                            <div className="hd-field">
                                                <label>Doctors on Duty</label>
                                                <input type="number" min="0" value={newDept.doctors_on_duty}
                                                       onChange={e => setNewDept(p => ({...p, doctors_on_duty: e.target.value}))}/>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="hd-form-btns">
                                    <button className="hd-btn-primary" onClick={addDepartment} disabled={deptSaving || !newDept.name}>
                                        {deptSaving ? 'Adding…' : 'Add Department'}
                                    </button>
                                    <button className="hd-btn-ghost" onClick={() => { setShowAddDept(false); setNewDept(EMPTY_DEPT); }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {deptsLoading
                            ? <div className="hd-loading"><div className="spinner"/>Loading…</div>
                            : departments.length === 0
                                ? <div className="hd-empty">
                                    <div className="hd-empty-icon">🏥</div>
                                    <p>No departments yet.</p>
                                    <p style={{fontSize:'14px',color:'#9ca3af'}}>Click <strong>+ Add Department</strong> above, or <strong>⚡ Setup Defaults</strong> to initialize blood inventory &amp; equipment.</p>
                                </div>
                                : <div className="hd-table-wrap">
                                    <div className="hd-table-head">
                                        <span>Department</span>
                                        <span>Total Beds</span>
                                        <span>Available</span>
                                        <span>Doctors</span>
                                        <span>Status</span>
                                        <span>Actions</span>
                                    </div>
                                    {departments.map(dept => (
                                        <div key={dept.id} className={`hd-table-row ${!dept.is_active ? 'hd-row-inactive' : ''}`}>
                                            {editingDept?.id === dept.id ? (
                                                <>
                                                    <span><input className="hd-inline-input" value={editingDept.name} onChange={e => setEditingDept(p => ({...p, name: e.target.value}))}/></span>
                                                    <span><input className="hd-inline-input hd-num" type="number" min="0" value={editingDept.total_beds} onChange={e => setEditingDept(p => ({...p, total_beds: e.target.value}))}/></span>
                                                    <span><input className="hd-inline-input hd-num" type="number" min="0" value={editingDept.available_beds} onChange={e => setEditingDept(p => ({...p, available_beds: e.target.value}))}/></span>
                                                    <span><input className="hd-inline-input hd-num" type="number" min="0" value={editingDept.doctors_on_duty} onChange={e => setEditingDept(p => ({...p, doctors_on_duty: e.target.value}))}/></span>
                                                    <span>
                                                        <label className="hd-toggle-wrap">
                                                            <input type="checkbox" checked={editingDept.is_active} onChange={e => setEditingDept(p => ({...p, is_active: e.target.checked}))}/>
                                                            <span className="hd-toggle-track"><span className="hd-toggle-thumb"/></span>
                                                            <span className="hd-toggle-label">{editingDept.is_active ? 'Active' : 'Off'}</span>
                                                        </label>
                                                    </span>
                                                    <span className="hd-row-btns">
                                                        <button className="hd-save-btn" onClick={saveDeptEdit} disabled={deptSaving}>{deptSaving ? '…' : 'Save'}</button>
                                                        <button className="hd-cancel-btn" onClick={() => setEditingDept(null)}>✕</button>
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="hd-dept-name">{dept.name}</span>
                                                    <span>{dept.total_beds}</span>
                                                    <span className={dept.available_beds <= 2 ? 'hd-text-warn' : 'hd-text-ok'}>{dept.available_beds}</span>
                                                    <span>{dept.doctors_on_duty}</span>
                                                    <span>
                                                        <span className={`hd-status-tag ${!dept.is_active ? 'hd-tag-inactive' : dept.available_beds <= 2 ? 'hd-tag-warn' : 'hd-tag-ok'}`}>
                                                            {!dept.is_active ? 'Inactive' : dept.available_beds <= 2 ? 'Limited' : 'Active'}
                                                        </span>
                                                    </span>
                                                    <span className="hd-row-btns">
                                                        <button className="hd-edit-btn" onClick={() => setEditingDept({...dept})}>Edit</button>
                                                        <button className="hd-del-btn" onClick={() => deleteDept(dept.id)}>Delete</button>
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                        }
                    </>
                )}

                {/* ═══════ BLOOD BANK ═══════ */}
                {activeTab === 'blood' && (
                    <>
                        <div className="hd-section-head">
                            <div>
                                <h2 className="hd-section-title">Blood Bank</h2>
                                <p className="hd-section-sub">Track and update blood inventory for all blood types</p>
                            </div>
                            <button className="hd-btn-ghost" onClick={handleSetupDefaults} disabled={setupLoading}>
                                {setupLoading ? 'Working…' : '⚡ Initialize All Types'}
                            </button>
                        </div>

                        {bloodLoading
                            ? <div className="hd-loading"><div className="spinner"/>Loading…</div>
                            : bloodInventory.length === 0
                                ? <div className="hd-empty">
                                    <div className="hd-empty-icon">🩸</div>
                                    <p>No blood inventory data.</p>
                                    <button className="hd-btn-primary" onClick={handleSetupDefaults} disabled={setupLoading} style={{marginTop:'14px'}}>
                                        {setupLoading ? 'Initializing…' : 'Initialize Blood Bank'}
                                    </button>
                                </div>
                                : <>
                                    <div className="hd-blood-grid">
                                        {bloodInventory.map(b => {
                                            const s = BLOOD_STYLES[b.blood_type] || {color:'#374151',bg:'#f3f4f6',border:'#e5e7eb'};
                                            const units = bloodEdits[b.id] ?? b.units_available;
                                            const level = units > 20 ? 'good' : units > 10 ? 'medium' : 'low';
                                            return (
                                                <div key={b.id} className="hd-blood-card" style={{background:s.bg, borderColor:s.border}}>
                                                    <div className="hd-blood-type" style={{color:s.color}}>{b.blood_type}</div>
                                                    <div className={`hd-stock-badge hd-stock-${level}`}>
                                                        {level==='good'?'● Good':level==='medium'?'◐ Medium':'○ Low'}
                                                    </div>
                                                    <div className="hd-blood-input-row">
                                                        <input type="number" min="0" className="hd-blood-input"
                                                               value={units}
                                                               onChange={e => setBloodEdits(p => ({...p, [b.id]: e.target.value}))}/>
                                                        <span className="hd-units-label">units</span>
                                                    </div>
                                                    <button className="hd-blood-save-btn" style={{background:s.color}}
                                                            onClick={() => saveBlood(b.id)} disabled={bloodSaving===b.id}>
                                                        {bloodSaving===b.id ? '…' : 'Save'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="hd-legend">
                                        <span><span className="hd-dot hd-dot-green"/>Good: &gt;20 units</span>
                                        <span><span className="hd-dot hd-dot-yellow"/>Medium: 11–20 units</span>
                                        <span><span className="hd-dot hd-dot-red"/>Low: ≤10 units</span>
                                    </div>
                                </>
                        }
                    </>
                )}

                {/* ═══════ EQUIPMENT ═══════ */}
                {activeTab === 'equipment' && (
                    <>
                        <div className="hd-section-head">
                            <div>
                                <h2 className="hd-section-title">Equipment Management</h2>
                                <p className="hd-section-sub">Track availability of critical medical equipment</p>
                            </div>
                            <button className="hd-btn-ghost" onClick={handleSetupDefaults} disabled={setupLoading}>
                                {setupLoading ? 'Working…' : '⚡ Initialize All Equipment'}
                            </button>
                        </div>

                        {equipLoading
                            ? <div className="hd-loading"><div className="spinner"/>Loading…</div>
                            : equipment.length === 0
                                ? <div className="hd-empty">
                                    <div className="hd-empty-icon">🔧</div>
                                    <p>No equipment data.</p>
                                    <button className="hd-btn-primary" onClick={handleSetupDefaults} disabled={setupLoading} style={{marginTop:'14px'}}>
                                        {setupLoading ? 'Initializing…' : 'Initialize Equipment'}
                                    </button>
                                </div>
                                : <div className="hd-equip-grid">
                                    {equipment.map(eq => {
                                        const icon = EQUIP_ICONS[eq.equipment_type] || '🏥';
                                        const isEdit = editingEquip?.id === eq.id;
                                        const label = eq.equipment_type?.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
                                        return (
                                            <div key={eq.id} className={`hd-equip-card ${eq.is_available ? 'hd-equip-on' : 'hd-equip-off'}`}>
                                                <div className="hd-equip-icon">{icon}</div>
                                                <div className="hd-equip-name">{label}</div>

                                                {isEdit ? (
                                                    <div className="hd-equip-edit-area">
                                                        <label className="hd-equip-edit-field">
                                                            Total
                                                            <input type="number" min="0" className="hd-equip-num-input"
                                                                   value={editingEquip.total_count}
                                                                   onChange={e => setEditingEquip(p => ({...p, total_count: e.target.value}))}/>
                                                        </label>
                                                        <label className="hd-equip-edit-field">
                                                            Avail
                                                            <input type="number" min="0" className="hd-equip-num-input"
                                                                   value={editingEquip.available_count}
                                                                   onChange={e => setEditingEquip(p => ({...p, available_count: e.target.value}))}/>
                                                        </label>
                                                        <div className="hd-equip-edit-btns">
                                                            <button className="hd-save-btn" onClick={saveEquipEdit} disabled={equipSaving}>{equipSaving ? '…' : 'Save'}</button>
                                                            <button className="hd-cancel-btn" onClick={() => setEditingEquip(null)}>✕</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="hd-equip-counts">
                                                        <span className="hd-count-num">{eq.available_count}</span>
                                                        <span className="hd-count-sep">/</span>
                                                        <span className="hd-count-total">{eq.total_count}</span>
                                                        <span className="hd-count-label">avail / total</span>
                                                    </div>
                                                )}

                                                <div className="hd-equip-footer">
                                                    <button className={`hd-avail-btn ${eq.is_available ? 'hd-avail-on' : 'hd-avail-off'}`}
                                                            onClick={() => toggleEquip(eq.id, eq.is_available)}>
                                                        {eq.is_available ? '✓ Available' : '✗ Unavailable'}
                                                    </button>
                                                    {!isEdit && (
                                                        <button className="hd-edit-sm-btn"
                                                                onClick={() => setEditingEquip({id:eq.id, total_count:eq.total_count, available_count:eq.available_count})}>
                                                            Edit Counts
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                        }
                    </>
                )}

                {/* ═══════ PROFILE ═══════ */}
                {activeTab === 'profile' && (
                    <>
                        <div className="hd-section-head">
                            <div>
                                <h2 className="hd-section-title">Hospital Profile</h2>
                                <p className="hd-section-sub">Update your hospital's contact information and capacity</p>
                            </div>
                        </div>

                        {profileLoading
                            ? <div className="hd-loading"><div className="spinner"/>Loading…</div>
                            : <div className="hd-profile-card card">
                                <div className="hd-profile-grid">
                                    <div className="hd-field">
                                        <label>Hospital Name</label>
                                        <input type="text" value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))}/>
                                    </div>
                                    <div className="hd-field">
                                        <label>Phone Number</label>
                                        <input type="text" value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))}/>
                                    </div>
                                    <div className="hd-field hd-field-full">
                                        <label>Address</label>
                                        <textarea rows="3" value={profileForm.address} onChange={e => setProfileForm(p => ({...p, address: e.target.value}))}/>
                                    </div>
                                    <div className="hd-field">
                                        <label>Email</label>
                                        <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({...p, email: e.target.value}))}/>
                                    </div>
                                    <div className="hd-field">
                                        <label>Emergency Contact Person</label>
                                        <input type="text" value={profileForm.emergency_contact} onChange={e => setProfileForm(p => ({...p, emergency_contact: e.target.value}))}/>
                                    </div>
                                    <div className="hd-field">
                                        <label>Total Bed Capacity</label>
                                        <input type="number" min="0" value={profileForm.bed_capacity} onChange={e => setProfileForm(p => ({...p, bed_capacity: e.target.value}))}/>
                                    </div>
                                </div>
                                <div className="hd-profile-footer">
                                    <button className="hd-btn-primary" onClick={saveProfile} disabled={profileSaving}>
                                        {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Profile'}
                                    </button>
                                    {profileSaved && <span className="hd-saved-hint">Changes saved successfully.</span>}
                                </div>
                            </div>
                        }
                    </>
                )}

            </div>
        </div>
    );
};

export default HospitalDashboard;
