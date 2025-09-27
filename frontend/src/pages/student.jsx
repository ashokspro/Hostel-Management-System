import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  User,
  MapPin,
  MessageCircle,
  FileText,
  TrendingUp
} from "lucide-react";

const StudentDashboard = ({ currentUser, addNotification }) => {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);

  // New gate pass form state
  const [newPassForm, setNewPassForm] = useState({
    reason: "",
    fromDate: "",
    outTime: "",
    returnTime: ""
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchGatePasses();
    fetchUserStats();
    fetchNotifications();
    
    // Auto-refresh data every 60 seconds
    const interval = setInterval(() => {
      fetchGatePasses();
      fetchUserStats();
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get("/api/gatepass/student", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGatePasses(response.data.gatePasses || []);
    } catch (err) {
      console.error("Error fetching gate passes:", err);
      addNotification?.("Failed to fetch gate passes", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("/api/user/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || {});
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("/api/user/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!newPassForm.reason.trim()) errors.reason = "Reason is required";
    if (!newPassForm.fromDate) errors.fromDate = "Date is required";
    if (!newPassForm.outTime) errors.outTime = "Out time is required";
    if (!newPassForm.returnTime) errors.returnTime = "Return time is required";

    if (newPassForm.fromDate < today) {
      errors.fromDate = "Date cannot be in the past";
    }

    if (newPassForm.outTime >= newPassForm.returnTime) {
      errors.returnTime = "Return time must be after out time";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setCreateLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post("/api/gatepass/create", newPassForm, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      addNotification?.(response.data.message, "success");
      setShowCreateModal(false);
      setNewPassForm({
        reason: "",
        fromDate: "",
        outTime: "",
        returnTime: ""
      });
      setFormErrors({});
      
      // Refresh gate passes list
      fetchGatePasses();
      fetchUserStats();
      
    } catch (err) {
      console.error("Error creating gate pass:", err);
      const errorMessage = err.response?.data?.message || "Failed to create gate pass";
      addNotification?.(errorMessage, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case 'Rejected': return <XCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case 'Pending': return <Clock className="me-1" style={{ width: "16px", height: "16px" }} />;
      default: return <AlertCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
    }
  };

  const downloadGatePassPDF = (gatePass) => {
    // Generate a simple text-based gate pass
    const passDetails = `
╔════════════════════════════════════════╗
║           HOSTEL GATE PASS             ║
║        Smart Hostel Management         ║
╠════════════════════════════════════════╣
║                                        ║
║  Name: ${currentUser.name.padEnd(29)} ║
║  ID: ${currentUser.id.padEnd(31)} ║
║  Room: ${(currentUser.room || 'N/A').padEnd(29)} ║
║                                        ║
║  Date: ${gatePass.from_date.padEnd(29)} ║
║  Out Time: ${gatePass.out_time.padEnd(25)} ║
║  Return Time: ${gatePass.return_time.padEnd(21)} ║
║                                        ║
║  Reason: ${gatePass.reason.substring(0, 27).padEnd(27)} ║
║  ${gatePass.reason.length > 27 ? gatePass.reason.substring(27, 54).padEnd(35) : ''.padEnd(35)} ║
║                                        ║
║  Status: ${gatePass.status.padEnd(27)} ║
║  Pass ID: ${gatePass.pass_id.substring(0, 8).padEnd(24)} ║
║                                        ║
║  ${gatePass.approved_by ? `Approved by: ${gatePass.approved_by.padEnd(20)}` : 'Awaiting approval'.padEnd(35)} ║
║                                        ║
╚════════════════════════════════════════╝

This gate pass is valid only for the specified date and time.
Please carry this pass and a valid ID while exiting/entering.

Generated on: ${new Date().toLocaleString()}
    `;
    
    const blob = new Blob([passDetails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GatePass_${gatePass.pass_id.substring(0, 8)}_${currentUser.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    addNotification?.("Gate pass downloaded successfully!", "success");
  };

  const canCreateNewPass = () => {
    return !stats.currentlyOut && stats.pendingPasses === 0;
  };

  const getCreateButtonMessage = () => {
    if (stats.currentlyOut) return "You are currently out. Return first to create a new pass.";
    if (stats.pendingPasses > 0) return "You have a pending gate pass. Wait for approval.";
    return "Create a new gate pass request";
  };

  if (loading && gatePasses.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row g-4">
        {/* Welcome Banner */}
        <div className="col-12">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="mb-1">Welcome back, {currentUser.name}!</h2>
                  <p className="mb-0 opacity-75">
                    Student ID: {currentUser.id} | Room: {currentUser.room || 'N/A'} | 
                    Course: {currentUser.course || 'N/A'} | Year: {currentUser.year || 'N/A'}
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="display-4 opacity-25">
                    <User style={{ width: "80px", height: "80px" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="col-12">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <FileText style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.totalPasses || 0}</h3>
                  <small>Total Passes</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <CheckCircle style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.approvedPasses || 0}</h3>
                  <small>Approved</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <Clock style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.pendingPasses || 0}</h3>
                  <small>Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className={`card ${stats.currentlyOut ? 'bg-danger' : 'bg-secondary'} text-white`}>
                <div className="card-body text-center">
                  <MapPin style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.currentlyOut ? 'OUT' : 'IN'}</h3>
                  <small>Current Status</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Rate Card */}
        {stats.totalPasses > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <TrendingUp className="text-success me-2" style={{ width: "24px", height: "24px" }} />
                  <div>
                    <h5 className="mb-1">Approval Rate: {stats.approvalRate || 0}%</h5>
                    <small className="text-muted">
                      {stats.approvedPasses} approved out of {stats.totalPasses} total requests
                    </small>
                  </div>
                  <div className="ms-auto">
                    <div className="progress" style={{ width: "200px", height: "8px" }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${stats.approvalRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center">
                  <AlertCircle className="me-2" style={{ width: "20px", height: "20px" }} />
                  Important Notifications
                </h5>
                {notifications.map((notification, index) => (
                  <div key={index} className={`alert alert-${notification.type === 'error' ? 'danger' : notification.type} mb-2`}>
                    <div className="d-flex align-items-start">
                      <strong>{notification.title}:</strong>
                      <span className="ms-2">{notification.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="card-title h4 mb-0">My Gate Passes</h2>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={() => setShowCreateModal(true)}
                    disabled={!canCreateNewPass()}
                    title={getCreateButtonMessage()}
                  >
                    <Plus style={{ width: "16px", height: "16px" }} />
                    Create Gate Pass
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      fetchGatePasses();
                      fetchUserStats();
                      fetchNotifications();
                    }}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {!canCreateNewPass() && (
                <div className="alert alert-warning mb-4">
                  <AlertCircle style={{ width: "16px", height: "16px" }} className="me-2" />
                  {getCreateButtonMessage()}
                </div>
              )}

              {gatePasses.length === 0 ? (
                <div className="text-center py-5">
                  <FileText style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                  <h5 className="text-muted mb-2">No Gate Passes Found</h5>
                  <p className="text-muted mb-3">You haven't created any gate passes yet.</p>
                  {canCreateNewPass() && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Your First Gate Pass
                    </button>
                  )}
                </div>
              ) : (
                <div className="row g-3">
                  {gatePasses.map((gatePass) => (
                    <div key={gatePass.pass_id} className="col-md-6 col-lg-4">
                      <div className="card border h-100">
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <span className={`badge bg-${getStatusColor(gatePass.status)} d-flex align-items-center`}>
                              {getStatusIcon(gatePass.status)}
                              {gatePass.status}
                            </span>
                            {gatePass.exit_status === 'Out' && (
                              <span className="badge bg-warning text-dark">Currently Out</span>
                            )}
                          </div>

                          <div className="mb-3 flex-grow-1">
                            <div className="d-flex align-items-center text-muted mb-1">
                              <Calendar style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>{new Date(gatePass.from_date).toLocaleDateString()}</small>
                            </div>
                            <div className="d-flex align-items-center text-muted mb-1">
                              <Clock style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>{gatePass.out_time} - {gatePass.return_time}</small>
                            </div>
                            <div className="d-flex align-items-center text-muted mb-2">
                              <MapPin style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>Room {gatePass.room_no}</small>
                            </div>
                            
                            <div className="mb-2">
                              <strong>Reason:</strong>
                              <p className="mb-0 small text-muted">{gatePass.reason}</p>
                            </div>
                          </div>

                          {gatePass.remarks && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center text-muted mb-1">
                                <MessageCircle style={{ width: "14px", height: "14px" }} className="me-1" />
                                <small><strong>Warden's Remarks:</strong></small>
                              </div>
                              <p className="small text-muted bg-light p-2 rounded">{gatePass.remarks}</p>
                            </div>
                          )}

                          {gatePass.approved_by && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center text-muted">
                                <User style={{ width: "14px", height: "14px" }} className="me-1" />
                                <small>Approved by: <strong>{gatePass.approved_by}</strong></small>
                              </div>
                              {gatePass.approved_at && (
                                <small className="text-muted">
                                  on {new Date(gatePass.approved_at).toLocaleString()}
                                </small>
                              )}
                            </div>
                          )}

                          <div className="mt-auto">
                            {gatePass.status === 'Approved' && (
                              <div className="d-grid">
                                <button
                                  className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2"
                                  onClick={() => downloadGatePassPDF(gatePass)}
                                >
                                  <Download style={{ width: "14px", height: "14px" }} />
                                  Download Pass
                                </button>
                              </div>
                            )}

                            <div className="mt-2 text-center">
                              <small className="text-muted font-monospace">
                                Pass ID: {gatePass.pass_id.substring(0, 8)}...
                              </small>
                            </div>
                            
                            <div className="text-center">
                              <small className="text-muted">
                                Created: {new Date(gatePass.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Gate Pass Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Plus style={{ width: "20px", height: "20px" }} />
                  Create New Gate Pass Request
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateModal(false);
                  setFormErrors({});
                }}></button>
              </div>
              
              <form onSubmit={handleCreateGatePass}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">
                        Reason for Going Out <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control ${formErrors.reason ? 'is-invalid' : ''}`}
                        value={newPassForm.reason}
                        onChange={(e) => setNewPassForm({ ...newPassForm, reason: e.target.value })}
                        placeholder="Please provide a detailed reason (e.g., Medical appointment at City Hospital, Shopping for essential items, etc.)"
                        rows="3"
                        maxLength="500"
                        required
                      />
                      <div className="form-text">
                        {newPassForm.reason.length}/500 characters
                      </div>
                      {formErrors.reason && <div className="invalid-feedback">{formErrors.reason}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${formErrors.fromDate ? 'is-invalid' : ''}`}
                        value={newPassForm.fromDate}
                        onChange={(e) => setNewPassForm({ ...newPassForm, fromDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 30 days from now
                        required
                      />
                      {formErrors.fromDate && <div className="invalid-feedback">{formErrors.fromDate}</div>}
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label fw-medium">
                        Out Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className={`form-control ${formErrors.outTime ? 'is-invalid' : ''}`}
                        value={newPassForm.outTime}
                        onChange={(e) => setNewPassForm({ ...newPassForm, outTime: e.target.value })}
                        required
                      />
                      {formErrors.outTime && <div className="invalid-feedback">{formErrors.outTime}</div>}
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label fw-medium">
                        Return Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className={`form-control ${formErrors.returnTime ? 'is-invalid' : ''}`}
                        value={newPassForm.returnTime}
                        onChange={(e) => setNewPassForm({ ...newPassForm, returnTime: e.target.value })}
                        required
                      />
                      {formErrors.returnTime && <div className="invalid-feedback">{formErrors.returnTime}</div>}
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-3">
                    <h6 className="alert-heading">Important Guidelines:</h6>
                    <ul className="mb-0 small">
                      <li>Gate pass requests require warden approval</li>
                      <li>You cannot create a new request while having a pending request</li>
                      <li>You must return before creating another gate pass</li>
                      <li>Provide accurate timing and genuine reasons</li>
                      <li>Carry your student ID and approved gate pass while going out</li>
                    </ul>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;

  useEffect(() => {
    fetchGatePasses();
    fetchUserStats();
    fetchNotifications();
    
    // Auto-refresh data every 60 seconds
    const interval = setInterval(() => {
      fetchGatePasses();
      fetchUserStats();
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get("/api/gatepass/student", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGatePasses(response.data.gatePasses || []);
    } catch (err) {
      console.error("Error fetching gate passes:", err);
      addNotification?.("Failed to fetch gate passes", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("/api/user/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || {});
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("/api/user/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!newPassForm.reason.trim()) errors.reason = "Reason is required";
    if (!newPassForm.fromDate) errors.fromDate = "Date is required";
    if (!newPassForm.outTime) errors.outTime = "Out time is required";
    if (!newPassForm.returnTime) errors.returnTime = "Return time is required";

    if (newPassForm.fromDate < today) {
      errors.fromDate = "Date cannot be in the past";
    }

    if (newPassForm.outTime >= newPassForm.returnTime) {
      errors.returnTime = "Return time must be after out time";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setCreateLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post("/api/gatepass/create", newPassForm, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      addNotification?.(response.data.message, "success");
      setShowCreateModal(false);
      setNewPassForm({
        reason: "",
        fromDate: "",
        outTime: "",
        returnTime: ""
      });
      setFormErrors({});
      
      // Refresh gate passes list
      fetchGatePasses();
      fetchUserStats();
      
    } catch (err) {
      console.error("Error creating gate pass:", err);
      const errorMessage = err.response?.data?.message || "Failed to create gate pass";
      addNotification?.(errorMessage, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case 'Rejected': return <XCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case 'Pending': return <Clock className="me-1" style={{ width: "16px", height: "16px" }} />;
      default: return <AlertCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
    }
  };

  const downloadGatePassPDF = (gatePass) => {
    // Generate a simple text-based gate pass
    const passDetails = `
╔════════════════════════════════════════╗
║           HOSTEL GATE PASS             ║
║        Smart Hostel Management         ║
╠════════════════════════════════════════╣
║                                        ║
║  Name: ${currentUser.name.padEnd(29)} ║
║  ID: ${currentUser.id.padEnd(31)} ║
║  Room: ${(currentUser.room || 'N/A').padEnd(29)} ║
║                                        ║
║  Date: ${gatePass.from_date.padEnd(29)} ║
║  Out Time: ${gatePass.out_time.padEnd(25)} ║
║  Return Time: ${gatePass.return_time.padEnd(21)} ║
║                                        ║
║  Reason: ${gatePass.reason.substring(0, 27).padEnd(27)} ║
║  ${gatePass.reason.length > 27 ? gatePass.reason.substring(27, 54).padEnd(35) : ''.padEnd(35)} ║
║                                        ║
║  Status: ${gatePass.status.padEnd(27)} ║
║  Pass ID: ${gatePass.pass_id.substring(0, 8).padEnd(24)} ║
║                                        ║
║  ${gatePass.approved_by ? `Approved by: ${gatePass.approved_by.padEnd(20)}` : 'Awaiting approval'.padEnd(35)} ║
║                                        ║
╚════════════════════════════════════════╝

This gate pass is valid only for the specified date and time.
Please carry this pass and a valid ID while exiting/entering.

Generated on: ${new Date().toLocaleString()}
    `;
    
    const blob = new Blob([passDetails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GatePass_${gatePass.pass_id.substring(0, 8)}_${currentUser.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    addNotification?.("Gate pass downloaded successfully!", "success");
  };

  const canCreateNewPass = () => {
    return !stats.currentlyOut && stats.pendingPasses === 0;
  };

  const getCreateButtonMessage = () => {
    if (stats.currentlyOut) return "You are currently out. Return first to create a new pass.";
    if (stats.pendingPasses > 0) return "You have a pending gate pass. Wait for approval.";
    return "Create a new gate pass request";
  };

  if (loading && gatePasses.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row g-4">
        {/* Welcome Banner */}
        <div className="col-12">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="mb-1">Welcome back, {currentUser.name}!</h2>
                  <p className="mb-0 opacity-75">
                    Student ID: {currentUser.id} | Room: {currentUser.room || 'N/A'} | 
                    Course: {currentUser.course || 'N/A'} | Year: {currentUser.year || 'N/A'}
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="display-4 opacity-25">
                    <User style={{ width: "80px", height: "80px" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="col-12">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <FileText style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.totalPasses || 0}</h3>
                  <small>Total Passes</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <CheckCircle style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.approvedPasses || 0}</h3>
                  <small>Approved</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <Clock style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.pendingPasses || 0}</h3>
                  <small>Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className={`card ${stats.currentlyOut ? 'bg-danger' : 'bg-secondary'} text-white`}>
                <div className="card-body text-center">
                  <MapPin style={{ width: "24px", height: "24px" }} className="mb-2" />
                  <h3 className="mb-1">{stats.currentlyOut ? 'OUT' : 'IN'}</h3>
                  <small>Current Status</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Rate Card */}
        {stats.totalPasses > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <TrendingUp className="text-success me-2" style={{ width: "24px", height: "24px" }} />
                  <div>
                    <h5 className="mb-1">Approval Rate: {stats.approvalRate || 0}%</h5>
                    <small className="text-muted">
                      {stats.approvedPasses} approved out of {stats.totalPasses} total requests
                    </small>
                  </div>
                  <div className="ms-auto">
                    <div className="progress" style={{ width: "200px", height: "8px" }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${stats.approvalRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center">
                  <AlertCircle className="me-2" style={{ width: "20px", height: "20px" }} />
                  Important Notifications
                </h5>
                {notifications.map((notification, index) => (
                  <div key={index} className={`alert alert-${notification.type === 'error' ? 'danger' : notification.type} mb-2`}>
                    <div className="d-flex align-items-start">
                      <strong>{notification.title}:</strong>
                      <span className="ms-2">{notification.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="card-title h4 mb-0">My Gate Passes</h2>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={() => setShowCreateModal(true)}
                    disabled={!canCreateNewPass()}
                    title={getCreateButtonMessage()}
                  >
                    <Plus style={{ width: "16px", height: "16px" }} />
                    Create Gate Pass
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      fetchGatePasses();
                      fetchUserStats();
                      fetchNotifications();
                    }}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {!canCreateNewPass() && (
                <div className="alert alert-warning mb-4">
                  <AlertCircle style={{ width: "16px", height: "16px" }} className="me-2" />
                  {getCreateButtonMessage()}
                </div>
              )}

              {gatePasses.length === 0 ? (
                <div className="text-center py-5">
                  <FileText style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                  <h5 className="text-muted mb-2">No Gate Passes Found</h5>
                  <p className="text-muted mb-3">You haven't created any gate passes yet.</p>
                  {canCreateNewPass() && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Your First Gate Pass
                    </button>
                  )}
                </div>
              ) : (
                <div className="row g-3">
                  {gatePasses.map((gatePass) => (
                    <div key={gatePass.pass_id} className="col-md-6 col-lg-4">
                      <div className="card border h-100">
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <span className={`badge bg-${getStatusColor(gatePass.status)} d-flex align-items-center`}>
                              {getStatusIcon(gatePass.status)}
                              {gatePass.status}
                            </span>
                            {gatePass.exit_status === 'Out' && (
                              <span className="badge bg-warning text-dark">Currently Out</span>
                            )}
                          </div>

                          <div className="mb-3 flex-grow-1">
                            <div className="d-flex align-items-center text-muted mb-1">
                              <Calendar style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>{new Date(gatePass.from_date).toLocaleDateString()}</small>
                            </div>
                            <div className="d-flex align-items-center text-muted mb-1">
                              <Clock style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>{gatePass.out_time} - {gatePass.return_time}</small>
                            </div>
                            <div className="d-flex align-items-center text-muted mb-2">
                              <MapPin style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>Room {gatePass.room_no}</small>
                            </div>
                            
                            <div className="mb-2">
                              <strong>Reason:</strong>
                              <p className="mb-0 small text-muted">{gatePass.reason}</p>
                            </div>
                          </div>

                          {gatePass.remarks && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center text-muted mb-1">
                                <MessageCircle style={{ width: "14px", height: "14px" }} className="me-1" />
                                <small><strong>Warden's Remarks:</strong></small>
                              </div>
                              <p className="small text-muted bg-light p-2 rounded">{gatePass.remarks}</p>
                            </div>
                          )}

                          {gatePass.approved_by && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center text-muted">
                                <User style={{ width: "14px", height: "14px" }} className="me-1" />
                                <small>Approved by: <strong>{gatePass.approved_by}</strong></small>
                              </div>
                              {gatePass.approved_at && (
                                <small className="text-muted">
                                  on {new Date(gatePass.approved_at).toLocaleString()}
                                </small>
                              )}
                            </div>
                          )}

                          <div className="mt-auto">
                            {gatePass.status === 'Approved' && (
                              <div className="d-grid">
                                <button
                                  className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2"
                                  onClick={() => downloadGatePassPDF(gatePass)}
                                >
                                  <Download style={{ width: "14px", height: "14px" }} />
                                  Download Pass
                                </button>
                              </div>
                            )}

                            <div className="mt-2 text-center">
                              <small className="text-muted font-monospace">
                                Pass ID: {gatePass.pass_id.substring(0, 8)}...
                              </small>
                            </div>
                            
                            <div className="text-center">
                              <small className="text-muted">
                                Created: {new Date(gatePass.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Gate Pass Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Plus style={{ width: "20px", height: "20px" }} />
                  Create New Gate Pass Request
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateModal(false);
                  setFormErrors({});
                }}></button>
              </div>
              
              <form onSubmit={handleCreateGatePass}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">
                        Reason for Going Out <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control ${formErrors.reason ? 'is-invalid' : ''}`}
                        value={newPassForm.reason}
                        onChange={(e) => setNewPassForm({ ...newPassForm, reason: e.target.value })}
                        placeholder="Please provide a detailed reason (e.g., Medical appointment at City Hospital, Shopping for essential items, etc.)"
                        rows="3"
                        maxLength="500"
                        required
                      />
                      <div className="form-text">
                        {newPassForm.reason.length}/500 characters
                      </div>
                      {formErrors.reason && <div className="invalid-feedback">{formErrors.reason}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${formErrors.fromDate ? 'is-invalid' : ''}`}
                        value={newPassForm.fromDate}
                        onChange={(e) => setNewPassForm({ ...newPassForm, fromDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 30 days from now
                        required
                      />
                      {formErrors.fromDate && <div className="invalid-feedback">{formErrors.fromDate}</div>}
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label fw-medium">
                        Out Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className={`form-control ${formErrors.outTime ? 'is-invalid' : ''}`}
                        value={newPassForm.outTime}
                        onChange={(e) => setNewPassForm({ ...newPassForm, outTime: e.target.value })}
                        required
                      />
                      {formErrors.outTime && <div className="invalid-feedback">{formErrors.outTime}</div>}
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label fw-medium">
                        Return Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className={`form-control ${formErrors.returnTime ? 'is-invalid' : ''}`}
                        value={newPassForm.returnTime}
                        onChange={(e) => setNewPassForm({ ...newPassForm, returnTime: e.target.value })}
                        required
                      />
                      {formErrors.returnTime && <div className="invalid-feedback">{formErrors.returnTime}</div>}
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-3">
                    <h6 className="alert-heading">Important Guidelines:</h6>
                    <ul className="mb-0 small">
                      <li>Gate pass requests require warden approval</li>
                      <li>You cannot create a new request while having a pending request</li>
                      <li>You must return before creating another gate pass</li>
                      <li>Provide accurate timing and genuine reasons</li>
                      <li>Carry your student ID and approved gate pass while going out</li>
                    </ul>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;});
  const [createLoading, setCreateLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchGatePasses();
    fetchUserStats();
    fetchNotifications();
  }, []);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:5000/api/gatepass/student", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGatePasses(response.data.gatePasses || []);
    } catch (err) {
      console.error("Error fetching gate passes:", err);
      addNotification?.("Failed to fetch gate passes", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:5000/api/user/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || {});
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:5000/api/user/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!newPassForm.reason.trim()) errors.reason = "Reason is required";
    if (!newPassForm.fromDate) errors.fromDate = "Date is required";
    if (!newPassForm.outTime) errors.outTime = "Out time is required";
    if (!newPassForm.returnTime) errors.returnTime = "Return time is required";

    if (newPassForm.fromDate < today) {
      errors.fromDate = "Date cannot be in the past";
    }

    if (newPassForm.outTime >= newPassForm.returnTime) {
      errors.returnTime = "Return time must be after out time";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setCreateLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post("http://localhost:5000/api/gatepass/create", newPassForm, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      addNotification?.(response.data.message, "success");
      setShowCreateModal(false);
      setNewPassForm({
        reason: "",
        fromDate: "",
        outTime: "",
        returnTime: ""
      });
      setFormErrors({});
      
      // Refresh gate passes list
      fetchGatePasses();
      fetchUserStats();
      
    } catch (err) {
      console.error("Error creating gate pass:", err);
      const errorMessage = err.response?.data?.message || "Failed to create gate pass";
      addNotification?.(errorMessage, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case 'Rejected': return <XCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case 'Pending': return <Clock className="me-1" style={{ width: "16px", height: "16px" }} />;
      default: return <AlertCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
    }
  };

  const downloadGatePassPDF = (gatePass) => {
    // For now, just show the gate pass details
    // In a real implementation, you'd generate a PDF
    const passDetails = `
Gate Pass Details:
Name: ${currentUser.name}
ID: ${currentUser.id}
Room: ${currentUser.room}
Date: ${gatePass.from_date}
Out Time: ${gatePass.out_time}
Return Time: ${gatePass.return_time}
Reason: ${gatePass.reason}
Status: ${gatePass.status}
Pass ID: ${gatePass.pass_id}
    `;
    
    const blob = new Blob([passDetails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GatePass_${gatePass.pass_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row g-4">
        {/* Statistics Cards */}
        <div className="col-12">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{stats.totalPasses || 0}</h3>
                  <small>Total Passes</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{stats.approvedPasses || 0}</h3>
                  <small>Approved</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{stats.pendingPasses || 0}</h3>
                  <small>Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className={`card ${stats.currentlyOut ? 'bg-danger' : 'bg-info'} text-white`}>
                <div className="card-body text-center">
                  <h3 className="mb-1">{stats.currentlyOut ? 'OUT' : 'IN'}</h3>
                  <small>Current Status</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Notifications</h5>
                {notifications.map((notification, index) => (
                  <div key={index} className={`alert alert-${notification.type === 'error' ? 'danger' : notification.type} mb-2`}>
                    <strong>{notification.title}:</strong> {notification.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="card-title h4 mb-0">My Gate Passes</h2>
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => setShowCreateModal(true)}
                  disabled={stats.currentlyOut || stats.pendingPasses > 0}
                >
                  <Plus style={{ width: "16px", height: "16px" }} />
                  Create Gate Pass
                </button>
              </div>

              {gatePasses.length === 0 ? (
                <div className="text-center py-5">
                  <AlertCircle style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                  <p className="text-muted">No gate passes found. Create your first gate pass!</p>
                </div>
              ) : (
                <div className="row g-3">
                  {gatePasses.map((gatePass) => (
                    <div key={gatePass.pass_id} className="col-md-6 col-lg-4">
                      <div className="card border">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <span className={`badge bg-${getStatusColor(gatePass.status)} d-flex align-items-center`}>
                              {getStatusIcon(gatePass.status)}
                              {gatePass.status}
                            </span>
                            {gatePass.exit_status === 'Out' && (
                              <span className="badge bg-warning text-dark">Currently Out</span>
                            )}
                          </div>

                          <div className="mb-3">
                            <div className="d-flex align-items-center text-muted mb-1">
                              <Calendar style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>{gatePass.from_date}</small>
                            </div>
                            <div className="d-flex align-items-center text-muted mb-1">
                              <Clock style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>{gatePass.out_time} - {gatePass.return_time}</small>
                            </div>
                            <div className="d-flex align-items-center text-muted mb-1">
                              <MapPin style={{ width: "14px", height: "14px" }} className="me-1" />
                              <small>Room {gatePass.room_no}</small>
                            </div>
                          </div>

                          <p className="card-text">
                            <strong>Reason:</strong> {gatePass.reason}
                          </p>

                          {gatePass.remarks && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center text-muted mb-1">
                                <MessageCircle style={{ width: "14px", height: "14px" }} className="me-1" />
                                <small><strong>Remarks:</strong></small>
                              </div>
                              <small className="text-muted">{gatePass.remarks}</small>
                            </div>
                          )}

                          {gatePass.approved_by && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center text-muted">
                                <User style={{ width: "14px", height: "14px" }} className="me-1" />
                                <small>Approved by: {gatePass.approved_by}</small>
                              </div>
                            </div>
                          )}

                          {gatePass.status === 'Approved' && (
                            <div className="d-grid">
                              <button
                                className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2"
                                onClick={() => downloadGatePassPDF(gatePass)}
                              >
                                <Download style={{ width: "14px", height: "14px" }} />
                                Download Pass
                              </button>
                            </div>
                          )}

                          <div className="mt-2">
                            <small className="text-muted">
                              Pass ID: {gatePass.pass_id.substring(0, 8)}...
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Gate Pass Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Plus style={{ width: "20px", height: "20px" }} />
                  Create New Gate Pass
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              
              <form onSubmit={handleCreateGatePass}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">Reason for Going Out *</label>
                      <textarea
                        className={`form-control ${formErrors.reason ? 'is-invalid' : ''}`}
                        value={newPassForm.reason}
                        onChange={(e) => setNewPassForm({ ...newPassForm, reason: e.target.value })}
                        placeholder="Enter reason for going out (e.g., Medical appointment, Shopping, etc.)"
                        rows="3"
                        required
                      />
                      {formErrors.reason && <div className="invalid-feedback">{formErrors.reason}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Date *</label>
                      <input
                        type="date"
                        className={`form-control ${formErrors.fromDate ? 'is-invalid' : ''}`}
                        value={newPassForm.fromDate}
                        onChange={(e) => setNewPassForm({ ...newPassForm, fromDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      {formErrors.fromDate && <div className="invalid-feedback">{formErrors.fromDate}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Out Time *</label>
                      <input
                        type="time"
                        className={`form-control ${formErrors.outTime ? 'is-invalid' : ''}`}
                        value={newPassForm.outTime}
                        onChange={(e) => setNewPassForm({ ...newPassForm, outTime: e.target.value })}
                        required
                      />
                      {formErrors.outTime && <div className="invalid-feedback">{formErrors.outTime}</div>}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Expected Return Time *</label>
                      <input
                        type="time"
                        className={`form-control ${formErrors.returnTime ? 'is-invalid' : ''}`}
                        value={newPassForm.returnTime}
                        onChange={(e) => setNewPassForm({ ...newPassForm, returnTime: e.target.value })}
                        required
                      />
                      {formErrors.returnTime && <div className="invalid-feedback">{formErrors.returnTime}</div>}
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-3">
                    <small>
                      <strong>Note:</strong> Gate pass requests require warden approval. 
                      You cannot create a new request while you have a pending request or are currently out.
                    </small>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Gate Pass'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;