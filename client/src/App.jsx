import React from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import HospitalDashboard from './components/hospital/hospitaldashboard';
import Ambulance from './components/Ambulance/ambulance';
import NewEmergency from './components/Ambulance/newemergency';
import HospitalSelection from './components/Ambulance/hospitalselection';
import Emergencies from './components/Ambulance/Emergencies';
import AmbulanceSettings from './components/Ambulance/Settings';
import HospitalSettings from './components/hospital/HospitalSettings';
import Alerts from './components/hospital/Alerts';
import Availability from './components/hospital/availability';
import Referrals from './components/hospital/referrals';
import Hospitals from './components/hospital/Hospitals';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
              <Route
                  path="/ambulance"
                  element={
                      <ProtectedRoute>
                          <Ambulance/>
                      </ProtectedRoute>
              }
            />
              <Route
                  path="/new-emergency"
                  element={
                      <ProtectedRoute>
                          <NewEmergency/>
                      </ProtectedRoute>
              }
            />
              <Route
                  path="/hospital-selection/:emergencyId"
                  element={
                      <ProtectedRoute>
                          <HospitalSelection/>
                      </ProtectedRoute>
              }
            />
              <Route
                  path="/hospital-dashboard"
                  element={
                      <ProtectedRoute>
                          <HospitalDashboard/>
                      </ProtectedRoute>
              } 
            />
              <Route
                  path="/alerts"
                  element={
                      <ProtectedRoute>
                          <Alerts/>
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/availability"
                  element={
                      <ProtectedRoute>
                          <Availability/>
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/referrals"
                  element={
                      <ProtectedRoute>
                          <Referrals/>
                      </ProtectedRoute>
                  }
              />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route
                  path="/emergencies"
                  element={
                      <ProtectedRoute>
                          <Emergencies/>
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/settings"
                  element={
                      <ProtectedRoute>
                          <AmbulanceSettings/>
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/hospital-settings"
                  element={
                      <ProtectedRoute>
                          <HospitalSettings/>
                      </ProtectedRoute>
                  }
              />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
