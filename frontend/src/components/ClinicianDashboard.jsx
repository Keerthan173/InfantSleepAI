import React, { useState, useEffect } from "react";

// Sample features for prediction testing
const sampleFeatures = {
  mean: -0.0254,
  std: 0.4431,
  min: -0.515,
  max: 3.41,
  median: -0.115,
  skewness: 5.44,
  kurtosis: 31.48,
  power_vlf: 0.0,
  power_lf: 0.0,
  power_hf: 0.00166,
  app_entropy: 0.2448,
  sample_entropy: 0.1327,
};

// PredictionForm Component
function PredictionForm() {
  const [features, setFeatures] = useState({
    mean: "", std: "", min: "", max: "", median: "",
    skewness: "", kurtosis: "", power_vlf: "", power_lf: "",
    power_hf: "", app_entropy: "", sample_entropy: ""
  });
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFeatures({ ...features, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const featureNumbers = {};
    for (const key in features) {
      featureNumbers[key] = parseFloat(features[key]);
    }
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: featureNumbers }),
      });
      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      setPrediction({ error: "Prediction failed" });
    }
    setLoading(false);
  };

  const autofill = () => {
    setFeatures(Object.fromEntries(
      Object.entries(sampleFeatures).map(([k, v]) => [k, v.toString()])
    ));
    setJsonInput(JSON.stringify({ features: sampleFeatures }, null, 2));
    setJsonError(null);
  };

  const handleJsonInputChange = (e) => {
    setJsonInput(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed.features) {
        const newFeatures = {};
        for (const key of Object.keys(features)) {
          newFeatures[key] = parsed.features[key]?.toString() || "";
        }
        setFeatures(newFeatures);
        setJsonError(null);
      } else {
        setJsonError('JSON must contain a "features" object.');
      }
    } catch (_) {
      setJsonError("Invalid JSON format.");
    }
  };

  return (
    <div className="card shadow-lg">
      <div className="card-body">
        <h5 className="card-title mb-4">Run Apnea Prediction Test</h5>

        <div className="mb-4 text-center">
          <button type="button" onClick={autofill} className="btn btn-primary">
            Auto-Fill Sample Features
          </button>
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold mb-2">
            Paste Feature JSON:
          </label>
          <textarea
            rows={6}
            value={jsonInput}
            onChange={handleJsonInputChange}
            placeholder='{"features": {"mean": ..., ...}}'
            className={`form-control font-monospace ${jsonError ? "is-invalid" : ""}`}
          />
          {jsonError && (
            <div className="invalid-feedback d-block">{jsonError}</div>
          )}
        </div>

        <div className="row g-3 mb-4">
          {Object.keys(features).map((key) => (
            <div key={key} className="col-md-6">
              <label className="form-label fw-semibold mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type="number"
                step="any"
                name={key}
                value={features[key]}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`btn btn-success px-5 ${loading ? "disabled" : ""}`}
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>

        {prediction && (
          <div className="mt-5 alert alert-secondary">
            {prediction.error ? (
              <div className="text-danger">{prediction.error}</div>
            ) : (
              <>
                <div>
                  <span className="fw-semibold">Prediction:</span>{" "}
                  {prediction.prediction}
                </div>
                <div>
                  <span className="fw-semibold">Confidence:</span>{" "}
                  {(prediction.confidence * 100).toFixed(2)}%
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// PatientDetailModal Component
function PatientDetailModal({ patient, onClose, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(patient);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    fetchPatientAlerts();
  }, []);

  const fetchPatientAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await fetch("http://localhost:8000/alerts?limit=50");
      const data = await response.json();
      // In production, filter by patient.patientId
      // For now, show sample alerts
      setAlerts(data.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
    setLoadingAlerts(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(patient);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years} yr ${months} mo` : `${years} yr`;
    }
  };

  const getAlertStats = () => {
    const critical = alerts.filter(a => a.prediction === "Apnea" || a.prediction === 2).length;
    const warnings = alerts.filter(a => a.prediction === "Pre-apnea Warning" || a.prediction === 1).length;
    const normal = alerts.length - critical - warnings;
    return { critical, warnings, normal, total: alerts.length };
  };

  const stats = getAlertStats();

  const getSeverityBadge = (prediction) => {
    if (prediction === "Apnea" || prediction === 2) {
      return <span className="badge bg-danger">Apnea</span>;
    } else if (prediction === "Pre-apnea Warning" || prediction === 1) {
      return <span className="badge bg-warning text-dark">Warning</span>;
    } else {
      return <span className="badge bg-success">Normal</span>;
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Patient Details - {patient.infantName}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="row">
              {/* Patient Information */}
              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Patient Information</h6>
                    {!isEditing ? (
                      <button className="btn btn-sm btn-outline-primary" onClick={handleEdit}>
                        Edit
                      </button>
                    ) : (
                      <div>
                        <button className="btn btn-sm btn-success me-2" onClick={handleSave}>
                          Save
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    {!isEditing ? (
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td className="fw-semibold">Patient ID:</td>
                            <td>{patient.patientId}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Name:</td>
                            <td>{patient.infantName}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Date of Birth:</td>
                            <td>{new Date(patient.dateOfBirth).toLocaleDateString()} ({calculateAge(patient.dateOfBirth)})</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Gender:</td>
                            <td>{patient.gender}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Weight:</td>
                            <td>{patient.weight} kg</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Admission Date:</td>
                            <td>{new Date(patient.admissionDate).toLocaleDateString()}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Medical Conditions:</td>
                            <td>{patient.medicalConditions || "None"}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Assigned Caregiver:</td>
                            <td>{patient.assignedCaregiver}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Parent/Guardian:</td>
                            <td>{patient.parentName}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Contact:</td>
                            <td>{patient.parentContact}</td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <div className="row g-2">
                        <div className="col-12">
                          <label className="form-label small fw-semibold">Infant Name</label>
                          <input
                            type="text"
                            name="infantName"
                            className="form-control form-control-sm"
                            value={editData.infantName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            name="weight"
                            className="form-control form-control-sm"
                            value={editData.weight}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Assigned Caregiver</label>
                          <input
                            type="text"
                            name="assignedCaregiver"
                            className="form-control form-control-sm"
                            value={editData.assignedCaregiver}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold">Medical Conditions</label>
                          <textarea
                            name="medicalConditions"
                            className="form-control form-control-sm"
                            rows="2"
                            value={editData.medicalConditions}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Parent Name</label>
                          <input
                            type="text"
                            name="parentName"
                            className="form-control form-control-sm"
                            value={editData.parentName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Contact</label>
                          <input
                            type="tel"
                            name="parentContact"
                            className="form-control form-control-sm"
                            value={editData.parentContact}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Monitoring Statistics</h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-3">
                        <h4 className="text-primary">{stats.total}</h4>
                        <small className="text-muted">Total Events</small>
                      </div>
                      <div className="col-3">
                        <h4 className="text-danger">{stats.critical}</h4>
                        <small className="text-muted">Critical</small>
                      </div>
                      <div className="col-3">
                        <h4 className="text-warning">{stats.warnings}</h4>
                        <small className="text-muted">Warnings</small>
                      </div>
                      <div className="col-3">
                        <h4 className="text-success">{stats.normal}</h4>
                        <small className="text-muted">Normal</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert History */}
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Recent Alert History</h6>
                    {loadingAlerts && <span className="spinner-border spinner-border-sm"></span>}
                  </div>
                  <div className="card-body p-0" style={{ maxHeight: "500px", overflowY: "auto" }}>
                    {alerts.length === 0 ? (
                      <div className="text-center text-muted py-5">
                        <p>No monitoring data available yet.</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {alerts.map((alert, index) => (
                          <div key={index} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              {getSeverityBadge(alert.prediction)}
                              <small className="text-muted">
                                {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "N/A"}
                              </small>
                            </div>
                            <div className="small">
                              <span className="badge bg-secondary me-1">Mean: {alert.mean?.toFixed(3)}</span>
                              <span className="badge bg-secondary me-1">Std: {alert.std?.toFixed(3)}</span>
                              {alert.confidence && (
                                <span className="badge bg-info">Conf: {(alert.confidence * 100).toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-danger" onClick={() => {
              if (window.confirm("Are you sure you want to delete this patient?")) {
                onDelete(patient.id);
                onClose();
              }
            }}>
              Delete Patient
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// PatientManagement Component
function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    patientId: "",
    infantName: "",
    dateOfBirth: "",
    gender: "",
    weight: "",
    admissionDate: "",
    medicalConditions: "",
    parentName: "",
    parentContact: "",
    assignedCaregiver: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const savedPatients = localStorage.getItem("patients");
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const newPatient = {
      ...formData,
      id: Date.now().toString(),
      registeredAt: new Date().toISOString(),
    };

    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    localStorage.setItem("patients", JSON.stringify(updatedPatients));

    setFormData({
      patientId: "",
      infantName: "",
      dateOfBirth: "",
      gender: "",
      weight: "",
      admissionDate: "",
      medicalConditions: "",
      parentName: "",
      parentContact: "",
      assignedCaregiver: "",
    });

    setSuccessMessage("Patient registered successfully!");
    setShowForm(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDelete = (id) => {
    const updatedPatients = patients.filter(p => p.id !== id);
    setPatients(updatedPatients);
    localStorage.setItem("patients", JSON.stringify(updatedPatients));
  };

  const handleUpdatePatient = (updatedPatient) => {
    const updatedPatients = patients.map(p => 
      p.id === updatedPatient.id ? updatedPatient : p
    );
    setPatients(updatedPatients);
    localStorage.setItem("patients", JSON.stringify(updatedPatients));
    setSuccessMessage("Patient updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years} yr ${months} mo` : `${years} yr`;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Patient Registry</h5>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add New Patient"}
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="card shadow mb-4">
          <div className="card-body">
            <h6 className="card-title text-primary mb-3">Patient Admission Form</h6>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Patient ID *</label>
                <input
                  type="text"
                  name="patientId"
                  className="form-control"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  placeholder="e.g., INF-2024-001"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Infant Name *</label>
                <input
                  type="text"
                  name="infantName"
                  className="form-control"
                  value={formData.infantName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Gender *</label>
                <select
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  className="form-control"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 3.2"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Admission Date *</label>
                <input
                  type="date"
                  name="admissionDate"
                  className="form-control"
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Assigned Caregiver *</label>
                <input
                  type="text"
                  name="assignedCaregiver"
                  className="form-control"
                  value={formData.assignedCaregiver}
                  onChange={handleInputChange}
                  placeholder="Caregiver name"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Medical Conditions</label>
                <textarea
                  name="medicalConditions"
                  className="form-control"
                  rows="2"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  placeholder="e.g., Premature birth, respiratory issues..."
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Parent/Guardian Name *</label>
                <input
                  type="text"
                  name="parentName"
                  className="form-control"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Contact Number *</label>
                <input
                  type="tel"
                  name="parentContact"
                  className="form-control"
                  value={formData.parentContact}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="mt-4 text-end">
              <button 
                onClick={handleSubmit}
                className="btn btn-success px-4"
                disabled={!formData.patientId || !formData.infantName || !formData.dateOfBirth}
              >
                Register Patient
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow">
        <div className="card-body">
          <h6 className="card-title mb-3">Registered Patients ({patients.length})</h6>
          
          {patients.length === 0 ? (
            <div className="text-center text-muted py-5">
              <p>No patients registered yet.</p>
              <p className="small">Click "Add New Patient" to register an infant.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Weight (kg)</th>
                    <th>Caregiver</th>
                    <th>Admission Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} style={{ cursor: "pointer" }}>
                      <td 
                        className="fw-semibold text-primary"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        {patient.patientId}
                      </td>
                      <td onClick={() => setSelectedPatient(patient)}>{patient.infantName}</td>
                      <td onClick={() => setSelectedPatient(patient)}>{calculateAge(patient.dateOfBirth)}</td>
                      <td onClick={() => setSelectedPatient(patient)}>{patient.gender}</td>
                      <td onClick={() => setSelectedPatient(patient)}>{patient.weight}</td>
                      <td onClick={() => setSelectedPatient(patient)}>{patient.assignedCaregiver}</td>
                      <td onClick={() => setSelectedPatient(patient)}>{new Date(patient.admissionDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                          }}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this patient?")) {
                              handleDelete(patient.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdate={handleUpdatePatient}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// Main Clinician Dashboard
function ClinicianDashboard() {
  const [activeTab, setActiveTab] = useState("patients");

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Clinician Dashboard</h2>
        <span className="badge bg-primary">Logged in as Clinician</span>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            Patient Management
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "prediction" ? "active" : ""}`}
            onClick={() => setActiveTab("prediction")}
          >
            Test Prediction
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {activeTab === "patients" && <PatientManagement />}
        {activeTab === "prediction" && <PredictionForm />}
      </div>
    </div>
  );
}

export default ClinicianDashboard;