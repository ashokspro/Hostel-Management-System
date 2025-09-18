"use client"

const SecurityDashboard = ({ currentUser, gatePasses, setGatePasses }) => {
  const toggleExitStatus = (passId) => {
    setGatePasses(
      gatePasses.map((pass) =>
        pass.pass_id === passId ? { ...pass, exit_status: pass.exit_status === "In" ? "Out" : "In" } : pass,
      ),
    )
  }

  const generateQRCode = (pass) => {
    return `QR:${pass.pass_id}|${pass.student_id}|${pass.status}|${pass.from_date}`
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title h4 mb-4">Gate Entry/Exit Management</h2>
            <div className="row g-3">
              {gatePasses
                .filter((pass) => pass.status === "Approved")
                .map((pass) => (
                  <div key={pass.pass_id} className="col-12">
                    <div className="card border">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="card-title">
                              {pass.student_name} (ID: {pass.student_id})
                            </h5>
                            <p className="card-text text-muted mb-1">
                              Room: {pass.room_no} | Reason: {pass.reason}
                            </p>
                            <p className="card-text text-muted mb-1">
                              Time: {pass.out_time} - {pass.return_time}
                            </p>
                            <p className="card-text text-muted mb-0">QR: {generateQRCode(pass)}</p>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <span
                              className={`badge ${pass.exit_status === "Out" ? "bg-warning text-dark" : "bg-info"}`}
                            >
                              {pass.exit_status}
                            </span>
                            <button
                              onClick={() => toggleExitStatus(pass.pass_id)}
                              className={`btn ${pass.exit_status === "In" ? "btn-warning" : "btn-info"}`}
                            >
                              Mark as {pass.exit_status === "In" ? "Out" : "In"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Currently Out Students */}
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title h4 mb-4">Currently Out Students</h2>
            <div className="row g-3">
              {gatePasses
                .filter((pass) => pass.exit_status === "Out" && pass.status === "Approved")
                .map((pass) => (
                  <div key={pass.pass_id} className="col-md-6 col-lg-4">
                    <div className="card bg-warning bg-opacity-10 border-warning">
                      <div className="card-body">
                        <h6 className="card-title text-warning-emphasis">{pass.student_name}</h6>
                        <p className="card-text text-warning-emphasis mb-1">ID: {pass.student_id}</p>
                        <p className="card-text text-warning-emphasis mb-1">Room: {pass.room_no}</p>
                        <p className="card-text text-warning-emphasis mb-0">Return by: {pass.return_time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              {gatePasses.filter((pass) => pass.exit_status === "Out" && pass.status === "Approved").length === 0 && (
                <div className="col-12">
                  <p className="text-muted text-center py-5">All students are currently in</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityDashboard
