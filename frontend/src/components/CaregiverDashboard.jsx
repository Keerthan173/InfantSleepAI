import React, { useState, useEffect } from "react";

function CaregiverDashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [expandedAlert, setExpandedAlert] = useState(null);

  // Load patients from localStorage
  useEffect(() => {
    const savedPatients = localStorage.getItem("patients");
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  }, []);

  // Fetch alerts from API
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/alerts?limit=20");
      const data = await response.json();
      setAlerts(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
    setLoading(false);
  };

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate statistics
  const getAlertStats = () => {
    const total = alerts.length;
    const critical = alerts.filter(a => 
      a.prediction === "Apnea" || a.prediction === 2
    ).length;
    const warnings = alerts.filter(a => 
      a.prediction === "Pre-apnea Warning" || a.prediction === 1
    ).length;
    const normal = total - critical - warnings;
    
    return { total, critical, warnings, normal };
  };

  const stats = getAlertStats();

  // Get severity badge
  const getSeverityBadge = (prediction) => {
    if (prediction === "Apnea" || prediction === 2) {
      return <span className="badge bg-danger">Apnea</span>;
    } else if (prediction === "Pre-apnea Warning" || prediction === 1) {
      return <span className="badge bg-warning text-dark">Warning</span>;
    } else {
      return <span className="badge bg-success">Normal</span>;
    }
  };

  // Get status color for patient card
  const getPatientStatus = (patientId) => {
    const recentAlerts = alerts.slice(0, 5);
    const hasApnea = recentAlerts.some(a => 
      a.prediction === "Apnea" || a.prediction === 2
    );
    const hasWarning = recentAlerts.some(a => 
      a.prediction === "Pre-apnea Warning" || a.prediction === 1
    );
    
    if (hasApnea) return { color: "danger", status: "Critical" };
    if (hasWarning) return { color: "warning", status: "Warning" };
    return { color: "success", status: "Stable" };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (epochs) => {
    if (!epochs) return "N/A";
    const seconds = epochs * 30;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <div className="container-fluid mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Caregiver Dashboard</h2>
          <p className="text-muted small mb-0">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={fetchAlerts} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Refreshing..." : "Refresh Alerts"}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Alerts</h6>
              <h3 className="mb-0">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-danger">
            <div className="card-body">
              <h6 className="text-danger mb-2">Critical (Apnea)</h6>
              <h3 className="mb-0 text-danger">{stats.critical}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-warning">
            <div className="card-body">
              <h6 className="text-warning mb-2">Warnings</h6>
              <h3 className="mb-0 text-warning">{stats.warnings}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-success">
            <div className="card-body">
              <h6 className="text-success mb-2">Normal</h6>
              <h3 className="mb-0 text-success">{stats.normal}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Patient List */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">My Patients ({patients.length})</h5>
            </div>
            <div className="card-body p-0">
              {patients.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No patients assigned yet.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {patients.map((patient) => {
                    const status = getPatientStatus(patient.patientId);
                    return (
                      <div
                        key={patient.id}
                        className={`list-group-item list-group-item-action ${
                          selectedPatient?.id === patient.id ? "active" : ""
                        }`}
                        onClick={() => setSelectedPatient(patient)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{patient.infantName}</h6>
                            <small className={selectedPatient?.id === patient.id ? "text-white-50" : "text-muted"}>
                              {patient.patientId}
                            </small>
                          </div>
                          <span className={`badge bg-${status.color}`}>
                            {status.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <small className={selectedPatient?.id === patient.id ? "text-white-50" : "text-muted"}>
                            Weight: {patient.weight} kg | Gender: {patient.gender}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Patient Details */}
          {selectedPatient && (
            <div className="card shadow mt-3">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">Patient Details</h6>
              </div>
              <div className="card-body">
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Name:</td>
                      <td>{selectedPatient.infantName}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Patient ID:</td>
                      <td>{selectedPatient.patientId}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">DOB:</td>
                      <td>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Gender:</td>
                      <td>{selectedPatient.gender}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Weight:</td>
                      <td>{selectedPatient.weight} kg</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Conditions:</td>
                      <td>{selectedPatient.medicalConditions || "None"}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Parent:</td>
                      <td>{selectedPatient.parentName}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Contact:</td>
                      <td>{selectedPatient.parentContact}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Alerts Feed */}
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Real-Time Alerts Feed</h5>
              {loading && <span className="spinner-border spinner-border-sm"></span>}
            </div>
            <div className="card-body p-0" style={{ maxHeight: "700px", overflowY: "auto" }}>
              {alerts.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No alerts available.</p>
                  <p className="small">Alerts will appear here in real-time.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {alerts.map((alert, index) => {
                    const isExpanded = expandedAlert === index;
                    const isApnea = alert.prediction === "Apnea" || alert.prediction === 2 || alert.predicted_label === 2;
                    const isWarning = alert.prediction === "Pre-apnea Warning" || alert.prediction === 1 || alert.predicted_label === 1;
                    
                    return (
                      <div
                        key={index}
                        className={`list-group-item ${
                          isApnea ? "border-start border-danger border-4" : 
                          isWarning ? "border-start border-warning border-4" : ""
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                              {getSeverityBadge(alert.prediction || alert.predicted_label)}
                              {alert.duration_epochs && (
                                <span className="badge bg-secondary">
                                  Duration: {formatDuration(alert.duration_epochs)}
                                </span>
                              )}
                              {alert.epoch && (
                                <span className="badge bg-info">
                                  Epoch: {alert.epoch}
                                </span>
                              )}
                              <span className="ms-2 text-muted small">
                                {formatTimestamp(alert.timestamp)}
                              </span>
                            </div>
                            
                            <div className="row mb-2">
                              <div className="col-md-8">
                                <small className="text-muted d-block mb-1">Quick Signal Stats:</small>
                                <div className="d-flex flex-wrap gap-1">
                                  <span className="badge bg-secondary" style={{ fontSize: "0.75rem" }}>
                                    Mean: {alert.mean?.toFixed(4) || "N/A"}
                                  </span>
                                  <span className="badge bg-secondary" style={{ fontSize: "0.75rem" }}>
                                    Std: {alert.std?.toFixed(4) || "N/A"}
                                  </span>
                                  <span className="badge bg-secondary" style={{ fontSize: "0.75rem" }}>
                                    Min: {alert.min?.toFixed(4) || "N/A"}
                                  </span>
                                  <span className="badge bg-secondary" style={{ fontSize: "0.75rem" }}>
                                    Max: {alert.max?.toFixed(4) || "N/A"}
                                  </span>
                                </div>
                              </div>
                              
                              {(alert.confidence || alert.predicted_prob) && (
                                <div className="col-md-4">
                                  <small className="text-muted d-block mb-1">Confidence:</small>
                                  <div className="progress" style={{ height: "20px" }}>
                                    <div
                                      className={`progress-bar ${
                                        isApnea ? "bg-danger" : 
                                        isWarning ? "bg-warning" : "bg-success"
                                      }`}
                                      style={{ width: `${((alert.confidence || alert.predicted_prob) * 100)}%` }}
                                    >
                                      <small>{((alert.confidence || alert.predicted_prob) * 100).toFixed(1)}%</small>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Expand/Collapse Button */}
                            <button 
                              className="btn btn-sm btn-outline-secondary w-100"
                              onClick={() => setExpandedAlert(isExpanded ? null : index)}
                            >
                              {isExpanded ? "Hide Full Details ▲" : "Show Full Details ▼"}
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-3 p-3 bg-light rounded">
                                <div className="row g-3">
                                  <div className="col-md-4">
                                    <h6 className="text-primary mb-2" style={{ fontSize: "0.9rem" }}>Statistical Features</h6>
                                    <table className="table table-sm table-borderless mb-0" style={{ fontSize: "0.85rem" }}>
                                      <tbody>
                                        <tr>
                                          <td className="fw-semibold">Mean:</td>
                                          <td>{alert.mean?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Std Dev:</td>
                                          <td>{alert.std?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Min:</td>
                                          <td>{alert.min?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Max:</td>
                                          <td>{alert.max?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Median:</td>
                                          <td>{alert.median?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="col-md-4">
                                    <h6 className="text-primary mb-2" style={{ fontSize: "0.9rem" }}>Distribution</h6>
                                    <table className="table table-sm table-borderless mb-3" style={{ fontSize: "0.85rem" }}>
                                      <tbody>
                                        <tr>
                                          <td className="fw-semibold">Skewness:</td>
                                          <td>{alert.skewness?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Kurtosis:</td>
                                          <td>{alert.kurtosis?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                      </tbody>
                                    </table>

                                    <h6 className="text-primary mb-2" style={{ fontSize: "0.9rem" }}>Entropy</h6>
                                    <table className="table table-sm table-borderless mb-0" style={{ fontSize: "0.85rem" }}>
                                      <tbody>
                                        <tr>
                                          <td className="fw-semibold">App Entropy:</td>
                                          <td>{alert.app_entropy?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Sample Entropy:</td>
                                          <td>{alert.sample_entropy?.toFixed(6) || "N/A"}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="col-md-4">
                                    <h6 className="text-primary mb-2" style={{ fontSize: "0.9rem" }}>Frequency Domain</h6>
                                    <table className="table table-sm table-borderless mb-0" style={{ fontSize: "0.85rem" }}>
                                      <tbody>
                                        <tr>
                                          <td className="fw-semibold">Power VLF:</td>
                                          <td>{alert.power_vlf?.toExponential(3) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Power LF:</td>
                                          <td>{alert.power_lf?.toExponential(3) || "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="fw-semibold">Power HF:</td>
                                          <td>{alert.power_hf?.toExponential(3) || "N/A"}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Alert Summary */}
          {alerts.length > 0 && (
            <div className="card shadow mt-3">
              <div className="card-body">
                <h6 className="card-title">Alert Summary</h6>
                <div className="row text-center">
                  <div className="col-4">
                    <div className="text-danger">
                      <h4>{stats.critical}</h4>
                      <small>Critical Events</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-warning">
                      <h4>{stats.warnings}</h4>
                      <small>Warning Events</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-success">
                      <h4>{stats.normal}</h4>
                      <small>Normal Readings</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaregiverDashboard;