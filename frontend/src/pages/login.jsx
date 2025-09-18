import React, { useState } from "react"
import axios from "axios"

const Login = () => {
  const [formData, setFormData] = useState({ id: "", password: "", userType: "student" })
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData)
      setMessage({ type: "success", text: res.data.message })
      console.log("Logged in user:", res.data.user)
    } catch (err) {
      setMessage({ type: "danger", text: err.response.data.message })
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header text-center">
              <h4 className="mb-0">Login</h4>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">User Type</label>
                  <select
                    className="form-select"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                  >
                    <option value="student">Student</option>
                    <option value="warden">Warden</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">ID</label>
                  <input
                    type="text"
                    name="id"
                    className="form-control"
                    value={formData.id}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="d-grid">
                  <button className="btn btn-primary">Login</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
