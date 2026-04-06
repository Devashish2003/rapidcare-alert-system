import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'AMBULANCE_DRIVER':
        return 'Ambulance Command Center';
      case 'PARAMEDIC_ASSISTANT':
        return 'Paramedic Assistant Panel';
      case 'DOCTOR':
        return 'Doctor Control Panel';
      case 'PARAMEDIC_STAFF':
        return 'Emergency Staff Dashboard';
      case 'FRONT_DESK':
        return 'Front Desk Operations';
      case 'CIVILIAN':
        return 'User Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getRoleSpecificFeatures = () => {
    switch (user?.role) {
      case 'AMBULANCE_DRIVER':
        return [
          { title: 'Start Emergency', desc: 'Create and broadcast emergency case' },
          { title: 'Nearby Hospitals', desc: 'Find optimal hospital instantly' },
          { title: 'Navigation', desc: 'Real-time route optimization' },
        ];
      case 'DOCTOR':
        return [
          { title: 'Incoming Cases', desc: 'View critical patients in queue' },
          { title: 'Patient Records', desc: 'Access medical history' },
          { title: 'Referrals', desc: 'Transfer patients efficiently' },
        ];
      default:
        return [
          { title: 'Explore Features', desc: 'Access available system tools' },
          { title: 'Profile Settings', desc: 'Manage your account' },
          { title: 'Help & Support', desc: 'Get assistance when needed' },
        ];
    }
  };

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">RapidCare</h2>

        <nav className="nav">
          <a className="nav-item active">Dashboard</a>
          <a className="nav-item">Emergencies</a>
          <a className="nav-item">Hospitals</a>
          <a className="nav-item">Settings</a>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div>
            <h1>{getWelcomeMessage()}</h1>
            <p>Welcome back, {user?.first_name}</p>
          </div>

          <div className="user-badge">
            {user?.role_display}
          </div>
        </div>

        {/* Cards */}
        <div className="dashboard-grid">

          {/* User Info */}
          <div className="card user-card">
            <h3>User Profile</h3>
            <div className="user-info">
              <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {user?.phone_number}</p>
            </div>
          </div>

          {/* Feature Cards */}
          {getRoleSpecificFeatures().map((f, i) => (
            <div key={i} className="card feature-card">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <button className="primary-btn">Open</button>
            </div>
          ))}

        </div>

      </main>
    </div>
  );
};

export default Dashboard;