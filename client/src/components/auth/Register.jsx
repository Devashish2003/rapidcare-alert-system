import React, { useState } from "react";
import "./Auth.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "CIVILIAN",
    subRole: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    // Mobile validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!mobileRegex.test(form.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }
    
    // Password validation
    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors.join(", ");
    }
    
    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    console.log("REGISTER DATA:", form);
    // TODO: API call
  };

  return (
    <div className="auth-wrapper">

      {/* LEFT SECTION */}
      <div className="auth-left">
        <div className="brand">
          <img src="/src/assets/rapidcarelogo.png" alt="RapidCare Logo" className="brand-logo" />
          <h1>RapidCare</h1>
          <p>Emergency Coordination Platform</p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="auth-right">
        <div className="auth-card">

          <h2>Create Account</h2>

          <form onSubmit={handleSubmit}>

            {/* NAME */}
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder=" "
                value={form.name}
                onChange={handleChange}
                required
              />
              <label>Full Name</label>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* EMAIL */}
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
                required
              />
              <label>Email</label>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* MOBILE */}
            <div className="input-group">
              <input
                type="tel"
                name="mobile"
                placeholder=" "
                value={form.mobile}
                onChange={handleChange}
                maxLength="10"
                required
              />
              <label>Mobile Number</label>
              {errors.mobile && <span className="error-message">{errors.mobile}</span>}
            </div>

            {/* PASSWORD */}
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder=" "
                value={form.password}
                onChange={handleChange}
                required
              />
              <label>Password</label>
              <span
                className="password-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder=" "
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <label>Confirm Password</label>
              <span
                className="password-eye"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </span>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            {/* ROLE */}
            <select
              name="role"
              value={form.role}
              onChange={(e) => {
                setForm({
                  ...form,
                  role: e.target.value,
                  subRole: "", // reset subRole when role changes
                });
              }}
            >
              <option value="CIVILIAN">Civilian</option>
              <option value="AMBULANCE">Ambulance Services</option>
              <option value="HOSPITAL">Hospital Staff</option>
            </select>

            {/* SUB ROLE - AMBULANCE */}
            {form.role === "AMBULANCE" && (
              <select
                name="subRole"
                value={form.subRole}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="DRIVER">Driver</option>
                <option value="PARAMEDIC">Paramedic Assistant</option>
              </select>
            )}

            {/* SUB ROLE - HOSPITAL */}
            {form.role === "HOSPITAL" && (
              <select
                name="subRole"
                value={form.subRole}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="DOCTOR">Doctor</option>
                <option value="STAFF">Paramedic Staff</option>
                <option value="ADMIN">Front Desk/Admin</option>
              </select>
            )}

            {/* BUTTON */}
            <button type="submit">Create Account</button>

          </form>

          <p className="switch">Already have an account? <a href="/login" className="login-link">Login</a></p>

        </div>
      </div>

    </div>
  );
};

export default Register;