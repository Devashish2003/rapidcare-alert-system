import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const {login, loading: authLoading} = useAuth();
  
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    // Password validation
    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(form.email, form.password);

      const role = response.user.role;
      if (role === 'AMBULANCE_DRIVER' || role === 'PARAMEDIC_ASSISTANT') {
        navigate('/ambulance');
      } else if (role === 'DOCTOR' || role === 'PARAMEDIC_STAFF' || role === 'FRONT_DESK') {
        navigate('/hospital-dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      const errorMessage = error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.detail ||
          'Login failed. Please try again.';
      setErrors({general: errorMessage});
    } finally {
      setIsLoading(false);
    }
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

          <h2>Welcome Back</h2>

          {/* General Error Message */}
          {errors.general && (
              <div className="error-message general">
                {errors.general}
              </div>
          )}

          <form onSubmit={handleSubmit}>

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

            {/* BUTTON */}
            <button type="submit" disabled={isLoading || authLoading}>
              {isLoading || authLoading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          <p className="switch">Don't have an account? <a href="/register" className="login-link">Register</a></p>

        </div>
      </div>

    </div>
  );
};

export default Login;