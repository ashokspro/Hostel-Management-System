"use client"

import { useState, useEffect } from "react"
import { 
  LogIn, 
  LogOut, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Search,
  Calendar,
  User,
  MessageCircle,
  RefreshCw
} from "lucide-react"
import axios from "axios"

const SecurityDashboard = ({ currentUser, addNotification }) => {
  const [gatePasses, setGatePasses] = useState([])
  const [currentlyOut, setCurrentlyOut] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all") // all, out, overdue

  useEffect(() => {
    fetchApprovedPasses()
    fetchCurrentlyOut()
    fetchStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchApprovedPasses()
      fetchCurrentlyOut()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const fetchApprovedPasses = async () => {
    try {
      setLoading(true)
      const response = await axios.get("http://localhost:5000/api/gatepass/approved", getAuthHeaders())
      setGatePasses(response.data.approvedPasses || [])
    } catch (err) {
      console.error("Error fetching approved passes:", err)
      addNotification?.("Failed to fetch gate passes", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentlyOut = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/gatepass/currently-out", getAuthHeaders())
      setCurrentlyOut(response.data.currentlyOut || [])
    } catch (err) {
      console.error("Error fetching currently out students:", err)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/user/stats", getAuthHeaders())
      setStats(response.data.stats || {})
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const toggleExitStatus = async (passId, currentStatus) => {
    try {
      const endpoint = currentStatus === "In" ? "mark-exit" : "mark-return"
      const url = `http://localhost:5000/api/gatepass/${endpoint}/${passId}`
      
      const remarks = currentStatus === "In" ? "Student exited" : "Student returned"
      
      const response = await axios.post(url, { remarks }, getAuthHeaders())
      
      addNotification?.(response.data.message, "success")
      
      // Update local state
      setGatePasses(gatePasses.map(pass => 
        pass.pass_id === passId 
          ? { ...pass, exit_status: currentStatus === "In" ? "Out" : "In" }
          : pass
      ))
      
      // Refresh data
      fetchCurrentlyOut()
      fetchStats()
      
    } catch (err) {
      console.error("Error toggling exit status:", err)
      addNotification?.(err.response?.data?.message || "Failed to update status", "error")
    }
  }

  const bulkMarkReturn = async (passIds) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/gatepass/bulk-return",
        {
          passIds: passIds,
          remarks: "Bulk return processing"
        },
        getAuthHeaders()
      )
      
      addNotification?.(response.data.message, "success")
      
      // Refresh data
      fetchApprovedPasses()
      fetchCurrentlyOut()
      fetchStats()
      
    } catch (err) {
      console.error("Error in bulk return:", err)
      addNotification?.(err.response?.data?.message || "Failed to process bulk return", "error")
    }
  }

  const generateQRCode = (pass) => {
    return `QR:${pass.pass_id}|${pass.student_id}|${pass.status}|${pass.from_date}`
  }

  const isOverdue = (pass) => {
    if (pass.exit_status !== "Out") return false
    
    const now = new Date()
    const returnDate = new Date(`${pass.from_date} ${pass.return_time}`)
    return now > returnDate
  }

  const getFilteredPasses = () => {
    let filtered = gatePasses

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pass => 
        pass.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pass.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pass.room_no.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (selectedFilter === "out") {
      filtered = filtered.filter(pass => pass.exit_status === "Out")
    } else if (selectedFilter === "overdue") {
      filtered = filtered.filter(pass => pass.exit_status === "Out" && isOverdue(pass))
    }

    return filtered
  }

  const overdueStudents = currentlyOut.filter(pass => isOverdue(pass))

  if (loading && gatePasses.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const filteredPasses = getFilteredPasses()

  return (
    <div className="row g-4">
      {/* Statistics Cards */}
      <div className="col-12">
        <div className="row g-3">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <Users style={{ width: "24px", height: "24px" }} className="mb-2" />
                <h3 className="mb-1">{stats.todayPasses || 0}</h3>
                <small>Today's Passes</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <LogOut style={{ width: "24px", height: "24px" }} className="mb-2" />
                <h3 className="mb-1">{stats.currentlyOut || 0}</h3>
                <small>Currently Out</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <LogIn style={{ width: "24px", height: "24px" }} className="mb-2" />
                <h3 className="mb-1">{stats.todayReturns || 0}</h3>
                <small>Today's Returns</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body text-center">
                <AlertTriangle style={{ width: "24px", height: "24px" }} className="mb-2" />
                <h3 className="mb-1">{overdueStudents.length}</h3>
                <small>Overdue</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="card-title h4 mb-0">Gate Entry/Exit Management</h2>
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={() => {
                  fetchApprovedPasses()
                  fetchCurrentlyOut()
                  fetchStats()
                }}
              >
                <RefreshCw style={{ width: "16px", height: "16px" }} />
                Refresh
              </button>
            </div>
            
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search style={{ width: "16px", height: "16px" }} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, ID, or room..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Passes</option>
                  <option value="out">Currently Out</option>
                  <option value="overdue">Overdue Students</option>
                </select>
              </div>
              
              <div className="col-md-2">
                {currentlyOut.length > 0 && (
                  <button
                    className="btn btn-info w-100"
                    onClick={() => bulkMarkReturn(currentlyOut.map(p => p.pass_id))}
                  >
                    Bulk Return
                  </button>
                )}
              </div>
            </div>

            {/* Overdue Alert */}
            {overdueStudents.length > 0 && (
              <div className="alert alert-warning d-flex align-items-center mb-4">
                <AlertTriangle style={{ width: "20px", height: "20px" }} className="me-2" />
                <strong>Alert:</strong> {overdueStudents.length} student(s) are overdue for return!
              </div>
            )}

            {/* Gate Passes List */}
            <div className="row g-3">
              {filteredPasses.length === 0 ? (
                <div className="col-12">
                  <div className="text-center py-5">
                    <Users style={{ width: "48px", height: "48px" }} className="text-muted mb-3" />
                    <p className="text-muted">
                      {searchTerm || selectedFilter !== "all" 
                        ? "No gate passes match your filters." 
                        : "No approved gate passes found."}
                    </p>
                  </div>
                </div>
              ) : (
                filteredPasses.map((pass) => (
                  <div key={pass.pass_id} className="col-12">
                    <div className={`card border ${isOverdue(pass) ? 'border-danger' : ''}`}>
                      <div className="card-body">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <div className="d-flex align-items-center mb-2">
                              <h5 className="card-title mb-0 me-3">
                                {pass.student_name} (ID: {pass.student_id})
                              </h5>
                              
                              <span
                                className={`badge ${
                                  pass.exit_status === "Out" 
                                    ? isOverdue(pass) ? "bg-danger" : "bg-warning text-dark"
                                    : "bg-info"
                                }`}
                              >
                                {pass.exit_status}
                                {isOverdue(pass) && " (OVERDUE)"}
                              </span>
                            </div>
                            
                            <div className="row text-muted small">
                              <div className="col-md-6">
                                <div className="d-flex align-items-center mb-1">
                                  <User style={{ width: "14px", height: "14px" }} className="me-1" />
                                  <span>Room: {pass.room_no}</span>
                                </div>
                                <div className="d-flex align-items-center mb-1">
                                  <MessageCircle style={{ width: "14px", height: "14px" }} className="me-1" />
                                  <span>Reason: {pass.reason}</span>
                                </div>
                              </div>
                              
                              <div className="col-md-6">
                                <div className="d-flex align-items-center mb-1">
                                  <Calendar style={{ width: "14px", height: "14px" }} className="me-1" />
                                  <span>Date: {pass.from_date}</span>
                                </div>
                                <div className="d-flex align-items-center mb-1">
                                  <Clock style={{ width: "14px", height: "14px" }} className="me-1" />
                                  <span>Time: {pass.out_time} - {pass.return_time}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Show actual exit/return times if available */}
                            {(pass.actual_out_time || pass.actual_return_time) && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small className="text-muted">
                                  <strong>Actual Times:</strong>
                                  {pass.actual_out_time && (
                                    <span> Out: {new Date(pass.actual_out_time).toLocaleString()}</span>
                                  )}
                                  {pass.actual_return_time && (
                                    <span> | Return: {new Date(pass.actual_return_time).toLocaleString()}</span>
                                  )}
                                </small>
                              </div>
                            )}
                            
                            <div className="mt-2">
                              <small className="text-muted font-monospace">
                                QR: {generateQRCode(pass)}
                              </small>
                            </div>
                          </div>
                          
                          <div className="col-md-4 d-flex align-items-center justify-content-end">
                            <button
                              onClick={() => toggleExitStatus(pass.pass_id, pass.exit_status)}
                              className={`btn d-flex align-items-center gap-2 ${
                                pass.exit_status === "In" 
                                  ? "btn-warning" 
                                  : "btn-info"
                              }`}
                            >
                              {pass.exit_status === "In" ? (
                                <>
                                  <LogOut style={{ width: "16px", height: "16px" }} />
                                  Mark as Out
                                </>
                              ) : (
                                <>
                                  <LogIn style={{ width: "16px", height: "16px" }} />
                                  Mark as In
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Currently Out Students Summary */}
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="card-title h4 mb-0">Currently Out Students Summary</h2>
              <span className="badge bg-warning text-dark fs-6">{currentlyOut.length} Students</span>
            </div>
            
            {currentlyOut.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle style={{ width: "48px", height: "48px" }} className="text-success mb-3" />
                <p className="text-muted">All students are currently in the hostel</p>
              </div>
            ) : (
              <div className="row g-3">
                {currentlyOut.map((pass) => (
                  <div key={pass.pass_id} className="col-md-6 col-lg-4">
                    <div className={`card ${isOverdue(pass) ? 'bg-danger text-white' : 'bg-warning bg-opacity-10 border-warning'}`}>
                      <div className="card-body">
                        <h6 className={`card-title ${isOverdue(pass) ? 'text-white' : 'text-warning-emphasis'}`}>
                          {pass.student_name}
                          {isOverdue(pass) && (
                            <span className="badge bg-light text-danger ms-2">OVERDUE</span>
                          )}
                        </h6>
                        <p className={`card-text mb-1 ${isOverdue(pass) ? 'text-white' : 'text-warning-emphasis'}`}>
                          <strong>ID:</strong> {pass.student_id}
                        </p>
                        <p className={`card-text mb-1 ${isOverdue(pass) ? 'text-white' : 'text-warning-emphasis'}`}>
                          <strong>Room:</strong> {pass.room_no}
                        </p>
                        <p className={`card-text mb-1 ${isOverdue(pass) ? 'text-white' : 'text-warning-emphasis'}`}>
                          <strong>Expected Return:</strong> {pass.return_time}
                        </p>
                        {pass.actual_out_time && (
                          <p className={`card-text mb-0 ${isOverdue(pass) ? 'text-white' : 'text-warning-emphasis'}`}>
                            <strong>Left at:</strong> {new Date(pass.actual_out_time).toLocaleTimeString()}
                          </p>
                        )}
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
  )
}

export default SecurityDashboard