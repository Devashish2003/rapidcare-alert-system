import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const [heroData, setHeroData] = useState({
        tag: "Real-time Emergency Coordination",
        title: "Save Lives with Intelligent Emergency Response",
        subtitle: "Connect ambulances with the right hospitals instantly. Real-time tracking, intelligent recommendations, and seamless coordination for critical care.",
        ctaButtons: [
            {label: "Ambulance Driver", icon: "🚨", link: "/driver-login"},
            {label: "Hospital Staff", icon: "🏥", link: "/hospital-dashboard"},
            {label: "Find Hospitals", icon: "🔍", link: "/find-hospitals"},
        ],
    });

    const [features, setFeatures] = useState([
        {
            icon: "📍",
            title: "Real-time Location",
            description: "Live tracking of ambulances and nearest hospital recommendations",
        },
        {
            icon: "⚡",
            title: "Instant Alerts",
            description: "Sound and visual notifications to hospitals for immediate preparation",
        },
        {
            icon: "🤖",
            title: "Smart Matching",
            description: "AI-powered hospital recommendations based on patient condition",
        },
        {
            icon: "📱",
            title: "Offline Support",
            description: "Works without internet, syncs when connection is restored",
        },
    ]);

    const [howItWorksSteps, setHowItWorksSteps] = useState([
        {
            number: 1,
            title: "Create Emergency Request",
            description: "Ambulance driver inputs patient details and severity level",
        },
        {
            number: 2,
            title: "Get Smart Recommendations",
            description: "System suggests best hospitals based on distance, facilities, and availability",
        },
        {
            number: 3,
            title: "Hospital Prepares",
            description: "Selected hospital receives instant alert and prepares for patient arrival",
        },
    ]);

    const [footerData, setFooterData] = useState({
        brand: {
            name: "RapidCare",
            tagline: "Saving lives through intelligent emergency coordination",
            logo: "/src/assets/rapidcarelogo.png",
        },
        sections: [
            {
                title: "For Ambulances",
                links: [
                    {label: "Dashboard", link: "/ambulance-dashboard"},
                    {label: "Create Emergency", link: "/create-emergency"},
                    {label: "Track Patient", link: "/track-patient"},
                ],
            },
            {
                title: "For Hospitals",
                links: [
                    {label: "Receive Alerts", link: "/hospital-dashboard"},
                    {label: "Manage Availability", link: "/manage-availability"},
                    {label: "Patient Referrals", link: "/patient-referrals"},
                ],
            },
            {
                title: "Support",
                links: [
                    {label: "Help Center", link: "/help"},
                    {label: "Contact Us", link: "/contact"},
                    {label: "Privacy Policy", link: "/privacy"},
                ],
            },
        ],
    });

    // Fetch data from backend when component mounts
    useEffect(() => {
        console.log('Dashboard component mounted');
        console.log('Hero data:', heroData);
        console.log('Features:', features);
        console.log('How it works steps:', howItWorksSteps);
        console.log('Footer data:', footerData);

        // TODO: Replace with actual API calls
        // fetchHeroData();
        // fetchFeatures();
        // fetchHowItWorksSteps();
        // fetchFooterData();
    }, []);

  return (
      <div className="dashboard-wrapper">
          {/* HEADER */}
          <header className="dashboard-header">
              <div className="header-content">
                  <div className="logo-section">
                      <img src={footerData.brand.logo} alt="RapidCare Logo" className="logo"
                           onError={(e) => {
                               e.target.onerror = null;
                               e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3EEM%3C/text%3E%3C/svg%3E";
                           }}/>
                      <span className="brand-name">{footerData.brand.name}</span>
                  </div>
                  <Link to="/login" className="sign-in-btn">
                      Sign In
                  </Link>
              </div>
          </header>

          {/* HERO SECTION */}
          <section className="hero-section">
              <div className="hero-content">
                  <h1 className="hero-title">{heroData.title}</h1>
                  <p className="hero-subtitle">{heroData.subtitle}</p>

                  <div className="cta-buttons">
                      {heroData.ctaButtons.map((button, index) => (
                          <Link key={index} to={button.link}
                                className={`cta-btn ${index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary'}`}>
                              {button.label}
                          </Link>
                      ))}
          </div>
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
                      {howItWorksSteps.map((step, index) => (
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
                          <img src={footerData.brand.logo} alt="RapidCare Logo" className="logo"
                               onError={(e) => {
                                   e.target.onerror = null;
                                   e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Crect width='40' height='35' fill='%23dc2626' rx='6'/%3E%3Ctext x='20' y='23' text-anchor='middle' fill='white' font-family='Arial' font-size='12' font-weight='bold'%3EEM%3C/text%3E%3C/svg%3E";
                               }}/>
                          <span className="brand-name">{footerData.brand.name}</span>
                      </div>
                      <p className="footer-tagline">{footerData.brand.tagline}</p>
                  </div>

                  {footerData.sections.map((section, index) => (
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
                  <p>&copy; 2026 {footerData.brand.name}. All rights reserved.</p>
              </div>
          </footer>
    </div>
  );
};

export default Dashboard;