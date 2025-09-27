"use client"

import { Shield, Bell, User, ChevronDown, LogOut } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import axios from "axios"

const Header = ({ currentUser, userType, notifications = [], onLogout, onShowProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [userNotifications, setUserNotifications] = useState([])
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
    
    // Set up auto-refresh for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await axios.get("http://localhost:5000/api/user/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUserNotifications(response.data.notifications || [])
    } catch (err) {
      console.error("Error fetching notifications:", err)
    }
  }

  const handleProfileClick = () => {
    setShowDropdown(false)
    onShowProfile()
  }

  const handleLogoutClick = async () => {
    setShowDropdown(false)
    
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await axios.post("http://localhost:5000/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (err) {
      console.error("Logout API error:", err)
    } finally {
      // Clear local storage and logout regardless of API response
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userType')
      delete axios.defaults.headers.common['Authorization']
      onLogout()
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
      case 'danger':
        return '🔴'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      case 'info':
      default:
        return '💡'
    }
  }

  const getNotificationClass = (type) => {
    switch (type) {
      case 'error':
      case 'danger':
        return 'border-danger text-danger'
      case 'warning':
        return 'border-warning text-warning'
      case 'success':
        return 'border-success text-success'
      case 'info':
      default:
        return 'border-info text-info'
    }
  }

  // Use passed notifications or fetched user notifications
  const allNotifications = notifications.length > 0 ? notifications : userNotifications

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom sticky-top">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <div
            className="bg-primary rounded d-flex align-items-center justify-content-center me-3"
            style={{ width: "40px", height: "40px" }}
          >
            <Shield className="text-white" style={{ width: "24px", height: "24px" }} />
          </div>
          <div>
            <h1 className="h5 mb-0 fw-bold text-primary">Smart Hostel Management</h1>
            <small className="text-muted">Gate Pass System</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Notifications */}
          <div className="position-relative" ref={notificationRef}>
            <button
              type="button"
              className="btn btn-light position-relative d-flex align-items-center gap-2"
              onClick={() => {
                setShowNotifications(!showNotifications)
                fetchNotifications() // Refresh notifications when opened
              }}
            >
              <Bell style={{ width: "20px", height: "20px" }} className="text-muted" />
              {allNotifications.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {allNotifications.length}
                  <span className="visually-hidden">unread notifications</span>
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg"
                style={{
                  minWidth: "350px",
                  maxWidth: "400px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  zIndex: 1050,
                  top: "100%",
                }}
              >
                <div className="p-3 border-bottom bg-light">
                  <h6 className="mb-0">Notifications ({allNotifications.length})</h6>
                </div>
                
                <div className="py-2">
                  {allNotifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-muted">
                      <Bell style={{ width: "24px", height: "24px" }} className="mb-2 opacity-50" />
                      <p className="mb-0">No notifications</p>
                    </div>
                  ) : (
                    allNotifications.map((notification, index) => (
                      <div
                        key={notification.id || index}
                        className={`px-3 py-2 border-start border-3 ${getNotificationClass(notification.type)} hover-bg-light`}
                        style={{ borderLeftWidth: "3px !important" }}
                      >
                        <div className="d-flex align-items-start">
                          <span className="me-2">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-medium" style={{ fontSize: "0.9rem" }}>
                              {notification.title}
                            </h6>
                            <p className="mb-1 text-muted" style={{ fontSize: "0.8rem" }}>
                              {notification.message}
                            </p>
                            {notification.timestamp && (
                              <small className="text-muted">
                                {new Date(notification.timestamp).toLocaleString()}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {allNotifications.length > 0 && (
                  <div className="p-2 border-top bg-light text-center">
                    <button
                      className="btn btn-link btn-sm text-muted"
                      onClick={() => {
                        setUserNotifications([])
                        setShowNotifications(false)
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{ width: "24px", height: "24px", fontSize: "12px" }}
              >
                {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-start">
                <div className="fw-medium" style={{ fontSize: "0.9rem" }}>
                  {currentUser.name || 'User'}
                </div>
                <small className="text-muted text-capitalize">
                  {userType}
                  {currentUser.room && ` | ${currentUser.room}`}
                </small>
              </div>
              <ChevronDown
                style={{ width: "14px", height: "14px" }}
                className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showDropdown && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg"
                style={{
                  minWidth: "220px",
                  zIndex: 1050,
                  top: "100%",
                }}
              >
                {/* User Info Header */}
                <div className="px-3 py-2 border-bottom bg-light">
                  <div className="fw-medium">{currentUser.name}</div>
                  <small className="text-muted">
                    {currentUser.id} | {userType}
                    {currentUser.email && (
                      <><br/>{currentUser.email}</>
                    )}
                  </small>
                </div>

                <div className="py-1">
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent w-100 text-start"
                    onClick={handleProfileClick}
                    style={{
                      transition: "background-color 0.15s ease-in-out",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f9fa")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                  >
                    <User style={{ width: "16px", height: "16px" }} />
                    View & Edit Profile
                  </button>
                  
                  <hr className="dropdown-divider my-1" />
                  
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent w-100 text-start text-danger"
                    onClick={handleLogoutClick}
                    style={{
                      transition: "background-color 0.15s ease-in-out",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f9fa")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                  >
                    <LogOut style={{ width: "16px", height: "16px" }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
          cursor: pointer;
        }
        
        .rotate-180 {
          transform: rotate(180deg);
        }
        
        .transition-transform {
          transition: transform 0.2s ease-in-out;
        }
      `}</style>
    </nav>
  )
}

export default Header