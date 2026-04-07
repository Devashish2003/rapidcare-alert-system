import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import "./Auth.css";

const Register = () => {
    const navigate = useNavigate();
    const {register, loading: authLoading} = useAuth();

  const [form, setForm] = useState({
      username: "",
      first_name: "",
      last_name: "",
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

      // Hospital signup validation
      if (form.role === "HOSPITAL_SIGNUP") {
          if (!form.hospitalName?.trim()) {
              newErrors.hospitalName = "Hospital name is required";
          }
          if (!form.address?.trim()) {
              newErrors.address = "Address is required";
          }
          if (!form.phone?.trim()) {
              newErrors.phone = "Hospital phone is required";
          }
          if (!form.bedCapacity) {
              newErrors.bedCapacity = "Bed capacity is required";
          }
          if (!form.emergencyContact?.trim()) {
              newErrors.emergencyContact = "Emergency contact is required";
          }
          if (!form.adminEmail?.trim()) {
              newErrors.adminEmail = "Admin email is required";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) {
              newErrors.adminEmail = "Please enter a valid admin email";
          }
      } else {
          // Regular user validation
      // Username validation
      if (!form.username.trim()) {
          newErrors.username = "Username is required";
      }

      // First name validation
      if (!form.first_name.trim()) {
          newErrors.first_name = "First name is required";
      }

      // Last name validation
      if (!form.last_name.trim()) {
          newErrors.last_name = "Last name is required";
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
            let userData;

            if (form.role === "HOSPITAL_SIGNUP") {
                // Hospital signup data
                userData = {
                    name: form.hospitalName,
                    address: form.address,
                    phone: form.phone,
                    bed_capacity: parseInt(form.bedCapacity),
                    emergency_contact: form.emergencyContact,
                    admin_email: form.adminEmail,
                    password: form.password,
                    password_confirm: form.confirmPassword,
                };
            } else {
                // Regular user signup data
                userData = {
                    username: form.username,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    phone_number: form.mobile,
                    role: getBackendRole(form.role, form.subRole),
                    password: form.password,
                    password_confirm: form.confirmPassword,
                };
            }

            const response = await register(userData);

            // Redirect based on user role
            const redirectPath = form.role === "HOSPITAL_SIGNUP" ? '/hospital-dashboard' :
                response.user.role === 'CIVILIAN' ? '/dashboard' : '/admin/dashboard';
            navigate(redirectPath);

        } catch (error) {
            const errorData = error.response?.data || {};
            const newErrors = {};

            // Handle field-specific errors
            Object.keys(errorData).forEach(key => {
                if (Array.isArray(errorData[key])) {
                    newErrors[key] = errorData[key][0];
                } else if (typeof errorData[key] === 'string') {
                    newErrors[key] = errorData[key];
                }
            });

            // Handle non-field errors
            if (errorData.non_field_errors) {
                newErrors.general = errorData.non_field_errors[0];
            }

            setErrors(newErrors);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to map frontend roles to backend roles
    const getBackendRole = (role, subRole) => {
        if (role === 'CIVILIAN') return 'CIVILIAN';
        if (role === 'AMBULANCE') {
            return subRole === 'DRIVER' ? 'AMBULANCE_DRIVER' : 'PARAMEDIC_ASSISTANT';
        }
        if (role === 'HOSPITAL') {
            if (subRole === 'DOCTOR') return 'DOCTOR';
            if (subRole === 'STAFF') return 'PARAMEDIC_STAFF';
            if (subRole === 'ADMIN') return 'FRONT_DESK';
        }
        return 'CIVILIAN';
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

            {/* REGISTRATION TYPE BUTTONS */}
            <div className="registration-type">
                <button
                    type="button"
                    className={`type-btn ${form.role !== "HOSPITAL_SIGNUP" ? "active" : ""}`}
                    onClick={() => setForm({
                        ...form,
                        role: form.role === "HOSPITAL_SIGNUP" ? "CIVILIAN" : form.role,
                        subRole: ""
                    })}
                >
                    User Registration
                </button>
                <button
                    type="button"
                    className={`type-btn ${form.role === "HOSPITAL_SIGNUP" ? "active" : ""}`}
                    onClick={() => setForm({
                        ...form,
                        role: "HOSPITAL_SIGNUP",
                        subRole: ""
                    })}
                >
                    Hospital Registration
                </button>
            </div>

            {/* General Error Message */}
            {errors.general && (
                <div className="error-message general">
                    {errors.general}
                </div>
            )}

          <form onSubmit={handleSubmit}>

              {/* USERNAME */}
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder=" "
                value={form.username}
                onChange={handleChange}
                required
              />
                <label>Username</label>
                {errors.username && <span className="error-message">{errors.username}</span>}
            </div>

              {/* FIRST NAME */}
              <div className="input-group">
                  <input
                      type="text"
                      name="first_name"
                      placeholder=" "
                      value={form.first_name}
                      onChange={handleChange}
                      required
                  />
                  <label>First Name</label>
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
              </div>

              {/* LAST NAME */}
              <div className="input-group">
                  <input
                      type="text"
                      name="last_name"
                      placeholder=" "
                      value={form.last_name}
                      onChange={handleChange}
                      required
                  />
                  <label>Last Name</label>
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
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


              {/* ROLE - USER REGISTRATION */}
              {(form.role === "CIVILIAN" || form.role === "AMBULANCE" || form.role === "HOSPITAL") && (
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
              )}

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

              {/* HOSPITAL SIGNUP FIELDS */}
              {form.role === "HOSPITAL_SIGNUP" && (
                  <>
                      <div className="input-group">
                          <input
                              type="text"
                              name="hospitalName"
                              placeholder=" "
                              value={form.hospitalName || ""}
                              onChange={handleChange}
                              required
                          />
                          <label>Hospital Name</label>
                          {errors.hospitalName && <span className="error-message">{errors.hospitalName}</span>}
                      </div>

                      <div className="input-group">
                          <input
                              type="text"
                              name="address"
                              placeholder=" "
                              value={form.address || ""}
                              onChange={handleChange}
                              required
                          />
                          <label>Address</label>
                          {errors.address && <span className="error-message">{errors.address}</span>}
                      </div>

                      <div className="input-group">
                          <input
                              type="tel"
                              name="phone"
                              placeholder=" "
                              value={form.phone || ""}
                              onChange={handleChange}
                              maxLength="15"
                              required
                          />
                          <label>Hospital Phone</label>
                          {errors.phone && <span className="error-message">{errors.phone}</span>}
                      </div>

                      <div className="input-group">
                          <input
                              type="number"
                              name="bedCapacity"
                              placeholder=" "
                              value={form.bedCapacity || ""}
                              onChange={handleChange}
                              required
                          />
                          <label>Total Bed Capacity</label>
                          {errors.bedCapacity && <span className="error-message">{errors.bedCapacity}</span>}
                      </div>

                      <div className="input-group">
                          <input
                              type="text"
                              name="emergencyContact"
                              placeholder=" "
                              value={form.emergencyContact || ""}
                              onChange={handleChange}
                              required
                          />
                          <label>Emergency Contact Person</label>
                          {errors.emergencyContact && <span className="error-message">{errors.emergencyContact}</span>}
                      </div>

                      <div className="input-group">
                          <input
                              type="email"
                              name="adminEmail"
                              placeholder=" "
                              value={form.adminEmail || ""}
                              onChange={handleChange}
                              required
                          />
                          <label>Admin Email</label>
                          {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
                      </div>
                  </>
              )}

            {/* BUTTON */}
              <button type="submit" disabled={isLoading || authLoading}>
                  {isLoading || authLoading ? 'Creating Account...' : 'Create Account'}
              </button>

          </form>

          <p className="switch">Already have an account? <a href="/login" className="login-link">Login</a></p>

        </div>
      </div>

    </div>
  );
};

export default Register;