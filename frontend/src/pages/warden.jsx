"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Edit, Save, X, Search, Trash2, UserPlus } from "lucide-react"

const WardenDashboard = ({ currentUser, gatePasses, setGatePasses, addNotification, users, setUsers }) => {
  const [activeTab, setActiveTab] = useState("requests")
  const [editingStudent, setEditingStudent] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [selectedYear, setSelectedYear] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
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
  })
  const [addFormErrors, setAddFormErrors] = useState({})

  const approveRejectPass = (passId, action, remarks = "") => {
    setGatePasses(
      gatePasses.map((pass) =>
        pass.pass_id === passId
          ? { ...pass, status: action, approved_by: action === "Approved" ? currentUser.name : null, remarks }
          : pass,
      ),
    )
    addNotification(`Gate pass ${passId} has been ${action.toLowerCase()}`, action === "Approved" ? "success" : "error")
  }

  const handleEditStudent = (student) => {
    setEditingStudent(student.id)
    setEditForm({
      name: student.name,
      room: student.room,
      email: student.email,
      phone: student.phone,
      course: student.course,
      year: student.year,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
    })
  }

  const handleSaveStudent = (studentId) => {
    setUsers((prevUsers) => ({
      ...prevUsers,
      student: prevUsers.student.map((student) => (student.id === studentId ? { ...student, ...editForm } : student)),
    }))

    setEditingStudent(null)
    setEditForm({})
    addNotification(`Student ${editForm.name} details updated successfully!`, "success")
  }

  const handleCancelEdit = () => {
    setEditingStudent(null)
    setEditForm({})
  }

  // Add Student Functions
  const validateAddForm = () => {
    const errors = {}

    if (!addStudentForm.id.trim()) errors.id = "Student ID is required"
    else if (users.student.some((s) => s.id === addStudentForm.id)) errors.id = "Student ID already exists"

    if (!addStudentForm.name.trim()) errors.name = "Name is required"
    if (!addStudentForm.room.trim()) errors.room = "Room number is required"
    else if (users.student.some((s) => s.room === addStudentForm.room)) errors.room = "Room is already occupied"

    if (!addStudentForm.password.trim()) errors.password = "Password is required"
    else if (addStudentForm.password.length < 6) errors.password = "Password must be at least 6 characters"

    if (!addStudentForm.email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(addStudentForm.email)) errors.email = "Email is invalid"

    if (!addStudentForm.phone.trim()) errors.phone = "Phone is required"
    if (!addStudentForm.course.trim()) errors.course = "Course is required"
    if (!addStudentForm.guardianName.trim()) errors.guardianName = "Guardian name is required"
    if (!addStudentForm.guardianPhone.trim()) errors.guardianPhone = "Guardian phone is required"

    setAddFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddStudent = () => {
    if (!validateAddForm()) return

    const newStudent = {
      ...addStudentForm,
      id: addStudentForm.id.toUpperCase(),
    }

    setUsers((prevUsers) => ({
      ...prevUsers,
      student: [...prevUsers.student, newStudent],
    }))

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
    })
    setAddFormErrors({})
    setShowAddModal(false)
    addNotification(`Student ${newStudent.name} added successfully!`, "success")
  }

  const handleDeleteStudent = (student) => {
    setStudentToDelete(student)
    setShowDeleteModal(true)
  }

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return

    // Check if student has any gate passes
    const hasGatePasses = gatePasses.some((pass) => pass.student_id === studentToDelete.id)

    if (hasGatePasses) {
      addNotification(`Cannot delete ${studentToDelete.name}. Student has existing gate pass records.`, "error")
      setShowDeleteModal(false)
      setStudentToDelete(null)
      return
    }

    setUsers((prevUsers) => ({
      ...prevUsers,
      student: prevUsers.student.filter((student) => student.id !== studentToDelete.id),
    }))

    addNotification(`Student ${studentToDelete.name} removed successfully!`, "success")
    setShowDeleteModal(false)
    setStudentToDelete(null)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "success"
      case "Rejected":
        return "danger"
      case "Pending":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="me-1" style={{ width: "16px", height: "16px" }} />
      case "Rejected":
        return <XCircle className="me-1" style={{ width: "16px", height: "16px" }} />
      case "Pending":
        return <Clock className="me-1" style={{ width: "16px", height: "16px" }} />
      default:
        return <AlertCircle className="me-1" style={{ width: "16px", height: "16px" }} />
    }
  }

  // Filter students based on year and search term
  const filteredStudents = users.student.filter((student) => {
    const matchesYear = selectedYear === "all" || student.year === selectedYear
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesYear && matchesSearch
  })

  // Get student statistics
  const studentStats = {
    total: users.student.length,
    firstYear: users.student.filter((s) => s.year === "1st Year").length,
    secondYear: users.student.filter((s) => s.year === "2nd Year").length,
    thirdYear: users.student.filter((s) => s.year === "3rd Year").length,
    fourthYear: users.student.filter((s) => s.year === "4th Year").length,
  }

  return (
    <>
      <div className="row g-4">
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
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "students" ? "active" : ""}`}
                onClick={() => setActiveTab("students")}
              >
                <Users className="me-2" style={{ width: "16px", height: "16px" }} />
                Student Management
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
                <h2 className="card-title h4 mb-4">Pending Gate Pass Requests</h2>
                <div className="row g-3">
                  {gatePasses
                    .filter((pass) => pass.status === "Pending")
                    .map((pass) => (
                      <div key={pass.pass_id} className="col-12">
                        <div className="card border">
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-8">
                                <h5 className="card-title">
                                  {pass.student_name} (ID: {pass.student_id})
                                </h5>
                                <p className="card-text text-muted mb-1">Room: {pass.room_no}</p>
                                <p className="card-text text-muted mb-1">Reason: {pass.reason}</p>
                                <p className="card-text text-muted mb-1">Date: {pass.from_date}</p>
                                <p className="card-text text-muted mb-0">
                                  Time: {pass.out_time} - {pass.return_time}
                                </p>
                              </div>
                              <div className="col-md-4 d-flex gap-2 align-items-start">
                                <button
                                  onClick={() => approveRejectPass(pass.pass_id, "Approved")}
                                  className="btn btn-success d-flex align-items-center gap-2"
                                >
                                  <CheckCircle style={{ width: "16px", height: "16px" }} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => approveRejectPass(pass.pass_id, "Rejected")}
                                  className="btn btn-danger d-flex align-items-center gap-2"
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
                  {gatePasses.filter((pass) => pass.status === "Pending").length === 0 && (
                    <div className="col-12">
                      <p className="text-muted text-center py-5">No pending requests</p>
                    </div>
                  )}
                </div>
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
              </div>
            </div>

            {/* Student List */}
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="card-title h4 mb-0">Student Management</h2>
                    <div className="d-flex gap-3">
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
                        {filteredStudents.map((student) => (
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
                                <div>
                                  <div>{student.phone}</div>
                                </div>
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
                                  <div className="fw-medium">{student.guardianName}</div>
                                  <small className="text-muted">{student.guardianPhone}</small>
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

                  {filteredStudents.length === 0 && (
                    <div className="text-center py-5">
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
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Reason</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Exit Status</th>
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
                          <td>{pass.reason}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
  )
}

export default WardenDashboard
