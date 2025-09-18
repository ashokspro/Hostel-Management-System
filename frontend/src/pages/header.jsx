"use client"

import { Shield, Bell, User, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const Header = ({ currentUser, userType, notifications, onLogout, onShowProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleProfileClick = () => {
    setShowDropdown(false)
    onShowProfile()
  }

  const handleLogoutClick = () => {
    setShowDropdown(false)
    onLogout()
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <div
            className="bg-primary rounded d-flex align-items-center justify-content-center me-3"
            style={{ width: "40px", height: "40px" }}
          >
            <Shield className="text-white" style={{ width: "24px", height: "24px" }} />
          </div>
          <div>
            <h1 className="h5 mb-0 fw-bold">Smart Hostel Management</h1>
            <small className="text-muted">Gate Pass System</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <Bell style={{ width: "20px", height: "20px" }} className="text-muted" />
            <span className="badge bg-danger rounded-pill">{notifications.length}</span>
          </div>

          {/* Custom User Profile Dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <User style={{ width: "16px", height: "16px" }} />
              <div className="text-start">
                <div className="fw-medium">{currentUser.name}</div>
                <small className="text-muted text-capitalize">{userType}</small>
              </div>
              <ChevronDown
                style={{ width: "14px", height: "14px" }}
                className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Custom Dropdown Menu */}
            {showDropdown && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg"
                style={{
                  minWidth: "200px",
                  zIndex: 1050,
                  top: "100%",
                }}
              >
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
                    View Profile
                  </button>
                  <hr className="dropdown-divider my-1" />
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent w-100 text-start"
                    onClick={handleLogoutClick}
                    style={{
                      transition: "background-color 0.15s ease-in-out",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f9fa")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Header
