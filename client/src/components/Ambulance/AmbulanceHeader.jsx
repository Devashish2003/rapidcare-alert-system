import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import "./ambulance.css";

const NAV_ITEMS = [
    {label: "Dashboard", path: "/ambulance"},
    {label: "Emergencies", path: "/emergencies"},
    {label: "Hospitals", path: "/hospitals"},
    {label: "Settings", path: "/settings"},
];

const AmbulanceHeader = ({activePath, unitNumber}) => {
    const {user: authUser, logout} = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch { /* ignore */
        }
        navigate("/login");
    };

    const displayName =
        [authUser?.first_name, authUser?.last_name].filter(Boolean).join(" ") ||
        authUser?.username ||
        "Driver";
    const displayRole = authUser?.role_display || authUser?.role || "Ambulance Driver";

    return (
        <div className="top-header">
            <div className="left-section">
                {/* Logo */}
                <div className="logo-section">
                    <img
                        src="/src/assets/rapidcarelogo.png"
                        alt="RapidCare Logo"
                        className="logo"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                        }}
                    />
                    <div className="brand-section">
                        <span className="brand-name">RapidCare</span>
                        <span className="ambulance-unit">
                            {unitNumber ? `Unit #${unitNumber}` : "Ambulance"}
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <div className={`nav-buttons ${isMobileMenuOpen ? "mobile-open" : ""}`}>
                    {NAV_ITEMS.map(({label, path}) => (
                        <button
                            key={path}
                            className={`nav-btn ${activePath === path ? "active" : ""}`}
                            onClick={() => handleNavigation(path)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    className="hamburger-menu"
                    onClick={() => setIsMobileMenuOpen((o) => !o)}
                >
                    {isMobileMenuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* User profile button + dropdown */}
            <div className="user-profile" ref={profileRef}>
                <div
                    className="user-info"
                    onClick={() => setIsProfileOpen((o) => !o)}
                    role="button"
                    aria-expanded={isProfileOpen}
                >
                    <span className="user-avatar">🚑</span>
                    <div className="user-details">
                        <span className="user-name">{displayName}</span>
                        <span className="user-role">{displayRole}</span>
                    </div>
                    <span className="dropdown-arrow" style={{
                        transform: isProfileOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s"
                    }}>▼</span>
                </div>

                {isProfileOpen && (
                    <div className="profile-dropdown">
                        {/* Info section */}
                        <div className="pd-info">
                            <div className="pd-avatar">🚑</div>
                            <div>
                                <p className="pd-name">{displayName}</p>
                                <p className="pd-role">{displayRole}</p>
                            </div>
                        </div>

                        <div className="pd-divider"/>

                        <div className="pd-details">
                            {authUser?.email && (
                                <div className="pd-row">
                                    <span className="pd-label">Email</span>
                                    <span className="pd-value">{authUser.email}</span>
                                </div>
                            )}
                            {authUser?.phone_number && (
                                <div className="pd-row">
                                    <span className="pd-label">Phone</span>
                                    <span className="pd-value">{authUser.phone_number}</span>
                                </div>
                            )}
                            {unitNumber && (
                                <div className="pd-row">
                                    <span className="pd-label">Unit</span>
                                    <span className="pd-value">#{unitNumber}</span>
                                </div>
                            )}
                        </div>

                        <div className="pd-divider"/>

                        <div className="pd-actions">
                            <button
                                className="pd-btn pd-btn-primary"
                                onClick={() => handleNavigation("/settings")}
                            >
                                ✏️ Edit Profile
                            </button>
                            <button
                                className="pd-btn pd-btn-danger"
                                onClick={handleLogout}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AmbulanceHeader;
