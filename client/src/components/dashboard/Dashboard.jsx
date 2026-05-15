import React, {useState, useRef, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../../contexts/AuthContext';
import './Dashboard.css';

const roleHomePath = (role) => {
    if (role === 'AMBULANCE_DRIVER' || role === 'PARAMEDIC_ASSISTANT') return '/ambulance';
    if (role === 'DOCTOR' || role === 'PARAMEDIC_STAFF' || role === 'FRONT_DESK') return '/hospital-dashboard';
    return '/dashboard';
};

const UserMenu = ({user, logout}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="user-menu-wrap" ref={ref}>
            <button className="user-menu-btn" onClick={() => setOpen(!open)}>
                <span className="user-avatar-circle">{(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}</span>
                <span className="user-menu-name">{user.first_name || user.username}</span>
                <span className="user-menu-arrow">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="user-dropdown">
                    <div className="user-dropdown-header">
                        <strong>{user.first_name} {user.last_name}</strong>
                        <span className="user-dropdown-role">{user.role_display || user.role}</span>
                        <span className="user-dropdown-email">{user.email}</span>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item" onClick={() => { navigate(roleHomePath(user.role)); setOpen(false); }}>
                        Go to My Dashboard
                    </button>
                    <button className="user-dropdown-item logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const {user, isAuthenticated, logout} = useAuth();
    const navigate = useNavigate();

    const ctaButtons = [
        {label: "Ambulance Driver", icon: "🚨", link: isAuthenticated ? '/ambulance' : '/login', desc: "Access emergency dispatch dashboard"},
        {label: "Hospital Staff", icon: "🏥", link: isAuthenticated ? '/hospital-dashboard' : '/login', desc: "Manage alerts and patient intake"},
        {label: "Find Hospitals", icon: "🔍", link: '/hospitals', desc: "View nearby hospital availability"},
    ];

    const features = [
        {icon: "📍", title: "Real-time Location", description: "Live tracking of ambulances and nearest hospital recommendations"},
        {icon: "⚡", title: "Instant Alerts", description: "Sound and visual notifications to hospitals for immediate preparation"},
        {icon: "🤖", title: "Smart Matching", description: "AI-powered hospital recommendations based on patient condition"},
        {icon: "📱", title: "Offline Support", description: "Works without internet, syncs when connection is restored"},
    ];

    const steps = [
        {number: 1, title: "Create Emergency Request", description: "Ambulance driver inputs patient details and severity level"},
        {number: 2, title: "Get Smart Recommendations", description: "System suggests best hospitals based on distance, facilities, and availability"},
        {number: 3, title: "Hospital Prepares", description: "Selected hospital receives instant alert and prepares for patient arrival"},
    ];

    const footerSections = [
        {
            title: "For Ambulances",
            links: [
                {label: "Driver Dashboard", link: "/ambulance"},
                {label: "New Emergency", link: "/new-emergency"},
                {label: "Select Hospital", link: "/ambulance"},
            ],
        },
        {
            title: "For Hospitals",
            links: [
                {label: "Hospital Dashboard", link: "/hospital-dashboard"},
                {label: "Emergency Alerts", link: "/alerts"},
                {label: "Manage Availability", link: "/availability"},
                {label: "Patient Referrals", link: "/referrals"},
            ],
        },
        {
            title: "Account",
            links: [
                {label: "Login", link: "/login"},
                {label: "Register", link: "/register"},
            ],
        },
    ];

    return (
        <div className="dashboard-wrapper">
            {/* HEADER */}
            <header className="dashboard-header">
                <div className="header-content">
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
                        <span className="brand-name">RapidCare</span>
                    </div>

                    {isAuthenticated && user ? (
                        <UserMenu user={user} logout={logout} />
                    ) : (
                        <Link to="/login" className="sign-in-btn">Sign In</Link>
                    )}
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="hero-section">
                <div className="hero-content">
                    <span className="hero-tag">Real-time Emergency Coordination</span>
                    <h1 className="hero-title">Save Lives with Intelligent Emergency Response</h1>
                    <p className="hero-subtitle">
                        Connect ambulances with the right hospitals instantly. Real-time tracking,
                        intelligent recommendations, and seamless coordination for critical care.
                    </p>

                    <div className="cta-buttons">
                        {ctaButtons.map((button, index) => (
                            <Link
                                key={index}
                                to={button.link}
                                className={`cta-btn ${index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary'}`}
                            >
                                <span className="cta-icon">{button.icon}</span>
                                <span>{button.label}</span>
                            </Link>
                        ))}
                    </div>

                    {isAuthenticated && user && (
                        <p className="logged-in-hint">
                            Logged in as <strong>{user.first_name || user.username}</strong> ({user.role_display || user.role}) —{' '}
                            <Link to={roleHomePath(user.role)} style={{color: '#dc2626'}}>Go to your dashboard →</Link>
                        </p>
                    )}
                </div>
            </section>

            {/* KEY FEATURES SECTION */}
            <section className="features-section">
                <div className="features-container">
                    <h2 className="features-title">Key Features</h2>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="how-it-works-section">
                <div className="how-it-works-container">
                    <h2 className="section-title">How It Works</h2>
                    <div className="steps-container">
                        {steps.map((step, index) => (
                            <div key={index} className="step">
                                <div className="step-number">{step.number}</div>
                                <div className="step-content">
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-description">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="dashboard-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img
                                src="/src/assets/rapidcarelogo.png"
                                alt="RapidCare Logo"
                                className="logo"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3ERC%3C/text%3E%3C/svg%3E";
                                }}
                            />
                            <span className="brand-name">RapidCare</span>
                        </div>
                        <p className="footer-tagline">Saving lives through intelligent emergency coordination</p>
                    </div>

                    {footerSections.map((section, index) => (
                        <div key={index} className="footer-section">
                            <h4>{section.title}</h4>
                            <ul>
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link to={link.link}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 RapidCare. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
