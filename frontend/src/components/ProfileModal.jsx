"use client"

import { useState } from "react"
import { User, Lock, Eye, EyeOff } from "lucide-react"
import axios from "axios"

const ProfileModal = ({ user, userType, onClose, onUpdate, addNotification }) => {
  const [activeTab, setActiveTab] = useState("profile")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    ...(userType === "student" && {
      course: user.course || "",
      year: user.year || "",
      guardianName: user.guardian_name || user.guardianName || "",
      guardianPhone: user.guardian_phone || user.guardianPhone || "",
    }),
    ...(userType === "warden" && {
      department: user.department || "",
      experience: user.experience || "",
      qualification: user.qualification || "",
    }),
    ...(userType === "security" && {
      shift: user.shift || "",
      experience: user.experience || "",
      emergencyContact: user.emergency_contact || user.emergencyContact || "",
    }),
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await axios.put(
        "http://localhost:5000/api/user/profile",
        profileForm,
        getAuthHeaders()
      )

      // Update local storage
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // Call parent update function
      onUpdate(response.data.user)
      
      setSuccess("Profile updated successfully!")
      
      // Show notification if available
      addNotification?.("Profile updated successfully!", "success")

      setTimeout(() => {
        setSuccess("")
      }, 3000)
      
    } catch (err) {
      console.error("Error updating profile:", err)
      const errorMessage = err.response?.data?.message || "Failed to update profile. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Please fill all password fields")
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match")
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError("New password must be different from current password")
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/user/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        getAuthHeaders()
      )

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setSuccess("Password changed successfully!")
      
      // Show notification if available
      addNotification?.("Password changed successfully!", "success")

      setTimeout(() => {
        setSuccess("")
      }, 3000)
      
    } catch (err) {
      console.error("Error changing password:", err)
      const errorMessage = err.response?.data?.message || "Failed to change password. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const renderProfileFields = () => {
    const commonFields = (
      <>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-medium">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium">Email</label>
            <input
              type="email"
              className="form-control"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium">Phone</label>
            <input
              type="tel"
              className="form-control"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium">User ID</label>
            <input type="text" className="form-control" value={user.id} disabled readOnly />
          </div>
        </div>
      </>
    )

    if (userType === "student") {
      return (
        <>
          {commonFields}
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label fw-medium">Room Number</label>
              <input type="text" className="form-control" value={user.room} disabled readOnly />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Course</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.course}
                onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Year</label>
              <select
                className="form-select"
                value={profileForm.year}
                onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Guardian Name</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.guardianName}
                onChange={(e) => setProfileForm({ ...profileForm, guardianName: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Guardian Phone</label>
              <input
                type="tel"
                className="form-control"
                value={profileForm.guardianPhone}
                onChange={(e) => setProfileForm({ ...profileForm, guardianPhone: e.target.value })}
              />
            </div>
          </div>
        </>
      )
    }

    if (userType === "warden") {
      return (
        <>
          {commonFields}
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label fw-medium">Role</label>
              <input type="text" className="form-control" value={user.role} disabled readOnly />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Department</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Experience</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                placeholder="e.g., 5 years"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Qualification</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.qualification}
                onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                placeholder="e.g., PhD in Education"
              />
            </div>
          </div>
        </>
      )
    }

    if (userType === "security") {
      return (
        <>
          {commonFields}
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label fw-medium">Role</label>
              <input type="text" className="form-control" value={user.role} disabled readOnly />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Shift</label>
              <select
                className="form-select"
                value={profileForm.shift}
                onChange={(e) => setProfileForm({ ...profileForm, shift: e.target.value })}
              >
                <option value="">Select Shift</option>
                <option value="Day Shift (6 AM - 6 PM)">Day Shift (6 AM - 6 PM)</option>
                <option value="Night Shift (6 PM - 6 AM)">Night Shift (6 PM - 6 AM)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Experience</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                placeholder="e.g., 3 years"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Emergency Contact</label>
              <input
                type="tel"
                className="form-control"
                value={profileForm.emergencyContact}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                placeholder="+91-9876543210"
              />
            </div>
          </div>
        </>
      )
    }

    return commonFields
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <User style={{ width: "20px", height: "20px" }} />
              User Profile - {user.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* User Info Banner */}
            <div className="alert alert-info d-flex align-items-center mb-4">
              <User style={{ width: "20px", height: "20px" }} className="me-2" />
              <div>
                <strong>{user.name}</strong> ({user.id}) - <span className="text-capitalize">{userType}</span>
                {userType === "student" && user.room && <span> | Room {user.room}</span>}
              </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("profile")
                    setError("")
                    setSuccess("")
                  }}
                >
                  <User style={{ width: "16px", height: "16px" }} className="me-1" />
                  Profile Information
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "password" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("password")
                    setError("")
                    setSuccess("")
                  }}
                >
                  <Lock style={{ width: "16px", height: "16px" }} className="me-1" />
                  Change Password
                </button>
              </li>
            </ul>

            {/* Alert Messages */}
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError("")}></button>
              </div>
            )}
            {success && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate}>
                {renderProfileFields()}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Updating...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordChange}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium">Current Password</label>
                    <div className="input-group">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        className="form-control"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">New Password</label>
                    <div className="input-group">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="form-control"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Confirm New Password</label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <small>
                    <strong>Password Requirements:</strong>
                    <ul className="mb-0 mt-1">
                      <li>Minimum 6 characters long</li>
                      <li>Must be different from current password</li>
                      <li>Must match confirmation password</li>
                    </ul>
                  </small>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal