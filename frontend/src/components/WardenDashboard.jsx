import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Edit, Save, X, Search, Trash2, UserPlus } from "lucide-react";
import axios from "axios";

const WardenDashboard = ({ currentUser, addNotification }) => {
  const [activeTab, setActiveTab] = useState("requests");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedYear, setSelectedYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  
  // Data states
  const [gatePasses, setGatePasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Add student form
  const [addStudentForm, setAddStudentForm] = useState({
    id: "",
    name: "",
    room: "",
    password: "",
    email: "",
    phone: "",
    course: "",
    year: "1st Year",
    guardianName: "",
    guardianPhone: "",
  });
  const [addFormErrors, setAddFormErrors] = useState({});

  useEffect(() => {
    if (activeTab === "requests") {
      fetchPendingRequests();
    } else if (activeTab === "students") {
      fetchStudents();
    } else if (activeTab === "all-passes") {
      fetchAllPasses();
    }
    fetchDashboardStats();
  }, [activeTab]);

  // API Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/gatepass/pending", getAuthHeaders());
      setGatePasses(response.data.pendingRequests || []);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      addNotification?.("Failed to fetch pending requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/gatepass/all", getAuthHeaders());
      setGatePasses(response.data.gatePasses || []);
    } catch (err) {
      console.error("Error fetching all passes:", err);
      addNotification?.("Failed to fetch gate passes", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let url = "/api/admin/students";
      const params = new URLSearchParams();
      
      if (selectedYear !== "all") params.append("year", selectedYear);
      if (searchTerm) params.append("search", searchTerm);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, getAuthHeaders());
      setStudents(response.data.students || []);
    } catch (err) {
      console.error("Error fetching students:", err);
      addNotification?.("Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/api/admin/dashboard", getAuthHeaders());
      setStats(response.data || {});
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  const approveRejectPass = async (passId, action, remarks = "") => {
    try {
      const endpoint = action === "Approved" ? "approve" : "reject";
      const url = `/api/gatepass/${endpoint}/${passId}`;
      
      const response = await axios.post(url, { remarks }, getAuthHeaders());
      
      addNotification?.(response.data.message, action === "Approved" ? "success" : "error");
      
      // Update the gate passes list
      setGatePasses(gatePasses.map(pass => 
        pass.pass_id === passId 
          ? { ...pass, status: action, approved_by: currentUser.name, remarks }
          : pass
      ));
      
      // Refresh data
      if (activeTab === "requests") fetchPendingRequests();
      fetchDashboardStats();
      
    } catch (err) {
      console.error(`Error ${action.toLowerCase()}ing gate pass:`, err);
      addNotification?.(err.response?.data?.message || `Failed to ${action.toLowerCase()} gate pass`, "error");
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student.id);
    setEditForm({
      name: student.name,
      room: student.room,
      email: student.email,
      phone: student.phone,
      course: student.course,
      year: student.year,
      guardianName: student.guardian_name || "",
      guardianPhone: student.guardian_phone || "",
    });
  };

  const handleSaveStudent = async (studentId) => {
    try {
      const response = await axios.put(
        `/api/admin/students/${studentId}`,
        {
          name: editForm.name,
          room: editForm.room,
          email: editForm.email,
          phone: editForm.phone,
          course: editForm.course,
          year: editForm.year,
          guardianName: editForm.guardianName,
          guardianPhone: editForm.guardianPhone,
        },
        getAuthHeaders()
      );

      addNotification?.(response.data.message, "success");
      setEditingStudent(null);
      setEditForm({});
      
      // Update the students list
      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, ...editForm, guardian_name: editForm.guardianName, guardian_phone: editForm.guardianPhone }
          : student
      ));
      
    } catch (err) {
      console.error("Error updating student:", err);
      addNotification?.(err.response?.data?.message || "Failed to update student", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditForm({});
  };

  // Add Student Functions
  const validateAddForm = () => {
    const errors = {};

    if (!addStudentForm.id.trim()) errors.id = "Student ID is required";
    if (!addStudentForm.name.trim()) errors.name = "Name is required";
    if (!addStudentForm.room.trim()) errors.room = "Room number is required";
    if (!addStudentForm.password.trim()) errors.password = "Password is required";
    else if (addStudentForm.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!addStudentForm.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(addStudentForm.email)) errors.email = "Email is invalid";
    if (!addStudentForm.phone.trim()) errors.phone = "Phone is required";
    if (!addStudentForm.course.trim()) errors.course = "Course is required";
    if (!addStudentForm.guardianName.trim()) errors.guardianName = "Guardian name is required";
    if (!addStudentForm.guardianPhone.trim()) errors.guardianPhone = "Guardian phone is required";

    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddStudent = async () => {
    if (!validateAddForm()) return;

    try {
      const response = await axios.post(
        "/api/admin/students",
        addStudentForm,
        getAuthHeaders()
      );

      addNotification?.(response.data.message, "success");
      
      setAddStudentForm({
        id: "",
        name: "",
        room: "",
        password: "",
        email: "",
        phone: "",
        course: "",
        year: "1st Year",
        guardianName: "",
        guardianPhone: "",
      });
      setAddFormErrors({});
      setShowAddModal(false);
      
      // Refresh students list
      if (activeTab === "students") fetchStudents();
      fetchDashboardStats();
      
    } catch (err) {
      console.error("Error adding student:", err);
      addNotification?.(err.response?.data?.message || "Failed to add student", "error");
    }
  };

  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const response = await axios.delete(
        `/api/admin/students/${studentToDelete.id}`,
        getAuthHeaders()
      );
      
      addNotification?.(response.data.message, "success");
      
      // Remove student from local list
      setStudents(students.filter(student => student.id !== studentToDelete.id));
      
    } catch (err) {
      console.error("Error deleting student:", err);
      addNotification?.(err.response?.data?.message || "Failed to delete student", "error");
    } finally {
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "danger";
      case "Pending": return "warning";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case "Rejected":
        return <XCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
      case "Pending":
        return <Clock className="me-1" style={{ width: "16px", height: "16px" }} />;
      default:
        return <AlertCircle className="me-1" style={{ width: "16px", height: "16px" }} />;
    }
  };

  // Filter students based on search and year
  useEffect(() => {
    if (activeTab === "students") {
      const timeoutId = setTimeout(() => {
        fetchStudents();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedYear, activeTab]);

  // Get student statistics from fetched students
  const getStudentStats = () => {
    return {
      total: students.length,
      firstYear: students.filter(s => s.year === "1st Year").length,
      secondYear: students.filter(s => s.year === "2nd Year").length,
      thirdYear: students.filter(s => s.year === "3rd Year").length,
      fourthYear: students.filter(s => s.year === "4th Year").length,
    };
  };

  if (loading && gatePasses.length === 0 && students.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const studentStats = getStudentStats();

  return (
    <>
      <div className="row g-4">
        {/* Welcome Banner */}
        <div className="col-12">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="mb-1">Welcome, {currentUser.name}</h2>
                  <p className="mb-0 opacity-75">
                    Warden Dashboard | ID: {currentUser.id} | Role: {currentUser.role || 'Warden'}
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="display-4 opacity-25">
                    <Users style={{ width: "80px", height: "80px" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => setActiveTab("requests")}
              >
                <Clock className="me-2" style={{ width: "16px", height: "16px" }} />
                Gate Pass Requests
                {stats.gatePassStats?.pending > 0 && (
                  <span className="badge bg-danger ms-2">{stats.gatePassStats.pending}</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "students" ? "active" : ""}`}
                onClick={() => setActiveTab("students")}
              >
                <Users className="me-2" style={{ width: "16px", height: "16px" }} />
                Student Management
                <span className="badge bg-info ms-2">{studentStats.total}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "all-passes" ? "active" : ""}`}
                onClick={() => setActiveTab("all-passes")}
              >
                <AlertCircle className="me-2" style={{ width: "16px", height: "16px" }} />
                All Gate Passes
              </button>
            </li>
          </ul>
        </div>

        {/* Gate Pass Requests Tab */}
        {activeTab === "requests" && (
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title h4 mb-4">
                  Pending Gate Pass Requests
                  {gatePasses.length > 0 && (
                    <span className="badge bg-warning ms-2">{gatePasses.length}</span>
                  )}
                </h2>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : gatePasses.length === 0 ? (
                  <div className="text-center py-5">
                    <Clock style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                    <p className="text-muted">No pending requests at the moment.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {gatePasses.map((pass) => (
                      <div key={pass.pass_id} className="col-12">
                        <div className="card border">
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-8">
                                <h5 className="card-title">
                                  {pass.student_name} (ID: {pass.student_id})
                                </h5>
                                <p className="card-text text-muted mb-1">
                                  <strong>Room:</strong> {pass.room_no}
                                </p>
                                <p className="card-text text-muted mb-1">
                                  <strong>Reason:</strong> {pass.reason}
                                </p>
                                <p className="card-text text-muted mb-1">
                                  <strong>Date:</strong> {pass.from_date}
                                </p>
                                <p className="card-text text-muted mb-0">
                                  <strong>Time:</strong> {pass.out_time} - {pass.return_time}
                                </p>
                                <small className="text-muted">
                                  Requested: {new Date(pass.created_at).toLocaleString()}
                                </small>
                              </div>
                              <div className="col-md-4 d-flex gap-2 align-items-start flex-wrap">
                                <button
                                  onClick={() => approveRejectPass(pass.pass_id, "Approved")}
                                  className="btn btn-success d-flex align-items-center gap-2 flex-fill"
                                >
                                  <CheckCircle style={{ width: "16px", height: "16px" }} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => approveRejectPass(pass.pass_id, "Rejected")}
                                  className="btn btn-danger d-flex align-items-center gap-2 flex-fill"
                                >
                                  <XCircle style={{ width: "16px", height: "16px" }} />
                                  Reject
                                </button>
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
        )}

        {/* Student Management Tab */}
        {activeTab === "students" && (
          <>
            {/* Student Statistics */}
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-2">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h3 className="mb-1">{studentStats.total}</h3>
                      <small>Total Students</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center">
                      <h3 className="mb-1">{studentStats.firstYear}</h3>
                      <small>1st Year</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h3 className="mb-1">{studentStats.secondYear}</h3>
                      <small>2nd Year</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h3 className="mb-1">{studentStats.thirdYear}</h3>
                      <small>3rd Year</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-danger text-white">
                    <div className="card-body text-center">
                      <h3 className="mb-1">{studentStats.fourthYear}</h3>
                      <small>4th Year</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-secondary text-white">
                    <div className="card-body text-center">
                      <h3 className="mb-1">{stats.gatePassStats?.currentlyOut || 0}</h3>
                      <small>Currently Out</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="card-title h4 mb-0">Student Management</h2>
                    <div className="d-flex gap-3 flex-wrap">
                      {/* Add Student Button */}
                      <button
                        className="btn btn-success d-flex align-items-center gap-2"
                        onClick={() => setShowAddModal(true)}
                      >
                        <UserPlus style={{ width: "16px", height: "16px" }} />
                        Add Student
                      </button>

                      {/* Search */}
                      <div className="input-group" style={{ width: "300px" }}>
                        <span className="input-group-text">
                          <Search style={{ width: "16px", height: "16px" }} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Year Filter */}
                      <select
                        className="form-select"
                        style={{ width: "150px" }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        <option value="all">All Years</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Room</th>
                            <th>Course</th>
                            <th>Year</th>
                            <th>Contact</th>
                            <th>Guardian</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.id}>
                              <td>
                                <span className="badge bg-secondary">{student.id}</span>
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  />
                                ) : (
                                  <div>
                                    <div className="fw-medium">{student.name}</div>
                                    <small className="text-muted">{student.email}</small>
                                  </div>
                                )}
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={editForm.room}
                                    onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                                  />
                                ) : (
                                  <span className="badge bg-info">{student.room}</span>
                                )}
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={editForm.course}
                                    onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                                  />
                                ) : (
                                  student.course
                                )}
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <select
                                    className="form-select form-select-sm"
                                    value={editForm.year}
                                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                  >
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`badge ${
                                      student.year === "1st Year"
                                        ? "bg-info"
                                        : student.year === "2nd Year"
                                          ? "bg-success"
                                          : student.year === "3rd Year"
                                            ? "bg-warning"
                                            : "bg-danger"
                                    }`}
                                  >
                                    {student.year}
                                  </span>
                                )}
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <input
                                    type="tel"
                                    className="form-control form-control-sm"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  />
                                ) : (
                                  <div>{student.phone}</div>
                                )}
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <div>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm mb-1"
                                      value={editForm.guardianName}
                                      onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                                      placeholder="Guardian Name"
                                    />
                                    <input
                                      type="tel"
                                      className="form-control form-control-sm"
                                      value={editForm.guardianPhone}
                                      onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                                      placeholder="Guardian Phone"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="fw-medium">{student.guardian_name}</div>
                                    <small className="text-muted">{student.guardian_phone}</small>
                                  </div>
                                )}
                              </td>
                              <td>
                                {editingStudent === student.id ? (
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleSaveStudent(student.id)}
                                    >
                                      <Save style={{ width: "14px", height: "14px" }} />
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                                      <X style={{ width: "14px", height: "14px" }} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleEditStudent(student)}
                                    >
                                      <Edit style={{ width: "14px", height: "14px" }} />
                                    </button>
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => handleDeleteStudent(student)}
                                    >
                                      <Trash2 style={{ width: "14px", height: "14px" }} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!loading && students.length === 0 && (
                    <div className="text-center py-5">
                      <Users style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                      <p className="text-muted">No students found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* All Gate Passes Tab */}
        {activeTab === "all-passes" && (
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title h4 mb-4">All Gate Passes</h2>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Student</th>
                          <th>Reason</th>
                          <th>Date & Time</th>
                          <th>Status</th>
                          <th>Exit Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gatePasses.map((pass) => (
                          <tr key={pass.pass_id}>
                            <td>
                              <div>
                                <div className="fw-medium">{pass.student_name}</div>
                                <small className="text-muted">
                                  {pass.student_id} - {pass.room_no}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: "200px" }}>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div>{pass.from_date}</div>
                                <small className="text-muted">
                                  {pass.out_time} - {pass.return_time}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${getStatusBadge(pass.status)} d-flex align-items-center w-fit`}>
                                {getStatusIcon(pass.status)}
                                {pass.status}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${pass.exit_status === "Out" ? "bg-warning text-dark" : "bg-info"}`}
                              >
                                {pass.exit_status}
                              </span>
                            </td>
                            <td>
                              {pass.status === "Pending" && (
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => approveRejectPass(pass.pass_id, "Approved")}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => approveRejectPass(pass.pass_id, "Rejected")}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {pass.status !== "Pending" && (
                                <span className="text-muted">
                                  {pass.status === "Approved" ? "✓ Approved" : "✗ Rejected"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!loading && gatePasses.length === 0 && (
                  <div className="text-center py-5">
                    <AlertCircle style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                    <p className="text-muted">No gate passes found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <UserPlus style={{ width: "20px", height: "20px" }} />
                  Add New Student
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Student ID *</label>
                      <input
                        type="text"
                        className={`form-control ${addFormErrors.id ? "is-invalid" : ""}`}
                        value={addStudentForm.id}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, id: e.target.value })}
                        placeholder="e.g., S104"
                      />
                      {addFormErrors.id && <div className="invalid-feedback">{addFormErrors.id}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Full Name *</label>
                      <input
                        type="text"
                        className={`form-control ${addFormErrors.name ? "is-invalid" : ""}`}
                        value={addStudentForm.name}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                      {addFormErrors.name && <div className="invalid-feedback">{addFormErrors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Room Number *</label>
                      <input
                        type="text"
                        className={`form-control ${addFormErrors.room ? "is-invalid" : ""}`}
                        value={addStudentForm.room}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, room: e.target.value })}
                        placeholder="e.g., R401"
                      />
                      {addFormErrors.room && <div className="invalid-feedback">{addFormErrors.room}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Password *</label>
                      <input
                        type="password"
                        className={`form-control ${addFormErrors.password ? "is-invalid" : ""}`}
                        value={addStudentForm.password}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                      />
                      {addFormErrors.password && <div className="invalid-feedback">{addFormErrors.password}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Email *</label>
                      <input
                        type="email"
                        className={`form-control ${addFormErrors.email ? "is-invalid" : ""}`}
                        value={addStudentForm.email}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                        placeholder="student@hostel.edu"
                      />
                      {addFormErrors.email && <div className="invalid-feedback">{addFormErrors.email}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Phone *</label>
                      <input
                        type="tel"
                        className={`form-control ${addFormErrors.phone ? "is-invalid" : ""}`}
                        value={addStudentForm.phone}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, phone: e.target.value })}
                        placeholder="+91-9876543210"
                      />
                      {addFormErrors.phone && <div className="invalid-feedback">{addFormErrors.phone}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Course *</label>
                      <input
                        type="text"
                        className={`form-control ${addFormErrors.course ? "is-invalid" : ""}`}
                        value={addStudentForm.course}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, course: e.target.value })}
                        placeholder="e.g., Computer Science"
                      />
                      {addFormErrors.course && <div className="invalid-feedback">{addFormErrors.course}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Year *</label>
                      <select
                        className="form-select"
                        value={addStudentForm.year}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, year: e.target.value })}
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Guardian Name *</label>
                      <input
                        type="text"
                        className={`form-control ${addFormErrors.guardianName ? "is-invalid" : ""}`}
                        value={addStudentForm.guardianName}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, guardianName: e.target.value })}
                        placeholder="Guardian's full name"
                      />
                      {addFormErrors.guardianName && (
                        <div className="invalid-feedback">{addFormErrors.guardianName}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Guardian Phone *</label>
                      <input
                        type="tel"
                        className={`form-control ${addFormErrors.guardianPhone ? "is-invalid" : ""}`}
                        value={addStudentForm.guardianPhone}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, guardianPhone: e.target.value })}
                        placeholder="+91-9876543210"
                      />
                      {addFormErrors.guardianPhone && (
                        <div className="invalid-feedback">{addFormErrors.guardianPhone}</div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleAddStudent}>
                  Add Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Trash2 style={{ width: "20px", height: "20px" }} />
                  Confirm Delete
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>Warning:</strong> This action cannot be undone.
                </div>
                <p>
                  Are you sure you want to remove <strong>{studentToDelete.name}</strong> (ID: {studentToDelete.id})
                  from the system?
                </p>
                <div className="card bg-light">
                  <div className="card-body">
                    <h6>Student Details:</h6>
                    <ul className="mb-0">
                      <li>Name: {studentToDelete.name}</li>
                      <li>ID: {studentToDelete.id}</li>
                      <li>Room: {studentToDelete.room}</li>
                      <li>Course: {studentToDelete.course}</li>
                      <li>Year: {studentToDelete.year}</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteStudent}>
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WardenDashboard;