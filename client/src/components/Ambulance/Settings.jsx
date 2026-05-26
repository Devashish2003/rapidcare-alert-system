import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import AmbulanceHeader from "./AmbulanceHeader";
import "./ambulance.css";

const Settings = () => {
    const {user: authUser, logout} = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState({first_name: "", last_name: "", email: "", phone_number: ""});
    const [profileMsg, setProfileMsg] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [passwords, setPasswords] = useState({current_password: "", new_password: "", confirm_password: ""});
    const [passwordMsg, setPasswordMsg] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (authUser) {
            setProfile({
                first_name: authUser.first_name || "",
                last_name: authUser.last_name || "",
                email: authUser.email || "",
                phone_number: authUser.phone_number || "",
            });
        }
    }, [authUser]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            await apiService.updateUserProfile(profile);
            setProfileMsg({type: "success", text: "Profile updated successfully."});
        } catch (err) {
            setProfileMsg({type: "error", text: err.response?.data?.detail || "Failed to update profile."});
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setPasswordMsg({type: "error", text: "New passwords do not match."});
            return;
        }
        setPasswordLoading(true);
        setPasswordMsg(null);
        try {
            await apiService.changePassword({
                current_password: passwords.current_password,
                new_password: passwords.new_password,
            });
            setPasswordMsg({type: "success", text: "Password changed successfully."});
            setPasswords({current_password: "", new_password: "", confirm_password: ""});
        } catch (err) {
            setPasswordMsg({type: "error", text: err.response?.data?.detail || "Failed to change password."});
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (_) {
        }
        navigate("/login");
    };

    const inputStyle = {
        width: "100%",
        padding: "9px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        fontSize: "14px",
        color: "#111827",
        boxSizing: "border-box",
        marginTop: "4px",
    };

    const labelStyle = {fontSize: "13px", fontWeight: "600", color: "#374151", display: "block"};

    const msgBox = (msg) =>
        msg && (
            <div
                style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
                    color: msg.type === "success" ? "#166534" : "#dc2626",
                    border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                }}
            >
                {msg.text}
            </div>
        );

    return (
        <div className="dashboard-container">
            <AmbulanceHeader activePath="/settings"/>
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h2>Settings</h2>
                    <p>Manage your profile and account preferences</p>
                </div>
            </div>

            <div style={{margin: "0 30px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
                {/* PROFILE */}
                <div className="card">
                    <h4 style={{margin: "0 0 16px", fontSize: "16px", color: "#111827"}}>Profile Information</h4>
                    <form onSubmit={handleProfileSave} style={{display: "flex", flexDirection: "column", gap: "14px"}}>
                        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input
                                    style={inputStyle}
                                    value={profile.first_name}
                                    onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input
                                    style={inputStyle}
                                    value={profile.last_name}
                                    onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                style={{...inputStyle, background: "#f9fafb", color: "#6b7280"}}
                                value={profile.email}
                                disabled
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input
                                style={inputStyle}
                                value={profile.phone_number}
                                onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
                            />
                        </div>
                        {msgBox(profileMsg)}
                        <button
                            type="submit"
                            disabled={profileLoading}
                            style={{
                                padding: "10px",
                                background: profileLoading ? "#9ca3af" : "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: profileLoading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                            }}
                        >
                            {profileLoading ? "Saving..." : "Save Profile"}
                        </button>
                    </form>
                </div>

                {/* PASSWORD */}
                <div className="card">
                    <h4 style={{margin: "0 0 16px", fontSize: "16px", color: "#111827"}}>Change Password</h4>
                    <form onSubmit={handlePasswordChange}
                          style={{display: "flex", flexDirection: "column", gap: "14px"}}>
                        <div>
                            <label style={labelStyle}>Current Password</label>
                            <input
                                type="password"
                                style={inputStyle}
                                value={passwords.current_password}
                                onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>New Password</label>
                            <input
                                type="password"
                                style={inputStyle}
                                value={passwords.new_password}
                                onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <input
                                type="password"
                                style={inputStyle}
                                value={passwords.confirm_password}
                                onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                                required
                            />
                        </div>
                        {msgBox(passwordMsg)}
                        <button
                            type="submit"
                            disabled={passwordLoading}
                            style={{
                                padding: "10px",
                                background: passwordLoading ? "#9ca3af" : "#111827",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: passwordLoading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                            }}
                        >
                            {passwordLoading ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>

            {/* ACCOUNT ACTIONS */}
            <div className="card" style={{margin: "24px 30px 30px"}}>
                <h4 style={{margin: "0 0 12px", fontSize: "16px", color: "#111827"}}>Account</h4>
                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                    <div>
                        <p style={{margin: 0, fontSize: "14px", color: "#374151"}}>Sign out of your account on this
                            device.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "9px 20px",
                            background: "white",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
