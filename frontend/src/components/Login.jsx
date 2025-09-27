import React, { useState } from "react";
import { LogIn, User, Shield, Eye } from "lucide-react";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ 
    id: "", 
    password: "", 
    userType: "student" 
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const simulateLogin = async (userData) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock authentication logic
    const mockUsers = {
      student: { id: "STU001", password: "password123", name: "John Doe", room: "101", course: "Computer Science", year: "2nd" },
      warden: { id: "WAR001", password: "warden123", name: "Dr. Smith", department: "Hostel Management" },
      security: { id: "SEC001", password: "security123", name: "Mike Johnson", shift: "Night" }
    };

    const user = mockUsers[userData.userType];
    if (user && user.id === userData.id && user.password === userData.password) {
      return {
        success: true,
        message: "Login successful!",
        user: { ...user, userType: userData.userType },
        token: "mock-jwt-token"
      };
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await simulateLogin(formData);
      setMessage({ type: "success", text: response.message });
      
      // Store user data (in real app, you'd use proper state management)
      const userData = {
        ...response.user,
        token: response.token
      };
      
      console.log("Logged in user:", userData);
      
      // Call parent component's onLogin function to handle navigation
      if (onLogin) {
        setTimeout(() => {
          onLogin(userData);
        }, 1000); // Small delay to show success message
      } else {
        // Fallback: simulate navigation by showing success state
        setTimeout(() => {
          setMessage({ 
            type: "info", 
            text: `Welcome ${response.user.name}! Redirecting to ${formData.userType} dashboard...` 
          });
        }, 1000);
      }
      
    } catch (err) {
      setMessage({ type: "danger", text: err.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'student': return <User className="me-2" size={16} />;
      case 'warden': return <Shield className="me-2" size={16} />;
      case 'security': return <Eye className="me-2" size={16} />;
      default: return <User className="me-2" size={16} />;
    }
  };

  const getDemoCredentials = () => {
    const creds = {
      student: { id: "STU001", password: "password123" },
      warden: { id: "WAR001", password: "warden123" },
      security: { id: "SEC001", password: "security123" }
    };
    return creds[formData.userType];
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white text-center py-4">
              <LogIn size={48} className="mb-3" />
              <h3 className="mb-0">Hostel Management System</h3>
              <p className="mb-0 opacity-75">Please sign in to continue</p>
            </div>
            
            <div className="card-body p-4">
              {message && (
                <div className={`alert alert-${message.type} d-flex align-items-center`} role="alert">
                  {message.type === 'success' ? '✓' : message.type === 'danger' ? '✗' : 'ℹ'}
                  <span className="ms-2">{message.text}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-medium">User Type</label>
                <select
                  className="form-select form-select-lg"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="student">
                    👨‍🎓 Student
                  </option>
                  <option value="warden">
                    👨‍💼 Warden
                  </option>
                  <option value="security">
                    🛡️ Security
                  </option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">
                  {getUserTypeIcon(formData.userType)}
                  {formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)} ID
                </label>
                <input
                  type="text"
                  name="id"
                  className="form-control form-control-lg"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder={`Enter your ${formData.userType} ID`}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control form-control-lg"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="d-grid mb-3">
                <button 
                  className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2" 
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      Sign In
                    </>
                  )}
                </button>
              </div>

              {/* Demo Credentials */}
              <div className="card bg-light">
                <div className="card-body py-3">
                  <h6 className="card-title mb-2">Demo Credentials:</h6>
                  <div className="row text-sm">
                    <div className="col-6">
                      <strong>ID:</strong> {getDemoCredentials().id}
                    </div>
                    <div className="col-6">
                      <strong>Password:</strong> {getDemoCredentials().password}
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-outline-secondary btn-sm mt-2 w-100"
                    onClick={() => setFormData({
                      ...formData,
                      id: getDemoCredentials().id,
                      password: getDemoCredentials().password
                    })}
                    disabled={loading}
                  >
                    Use Demo Credentials
                  </button>
                </div>
              </div>
            </div>

            <div className="card-footer text-center text-muted py-3">
              <small>© 2024 Hostel Management System</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;