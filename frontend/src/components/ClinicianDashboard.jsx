import React from "react";
import PredictionForm from "./PredictionForm";

const ClinicianDashboard = () => {
  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Clinician Dashboard</h2>
      <div className="card shadow p-4">
        <h5 className="card-title text-primary">Run Apnea Prediction</h5>
        <p className="card-text">
          Enter patient signal features below or paste JSON to get predictions.
        </p>
        <PredictionForm />
      </div>
    </div>
  );
};

export default ClinicianDashboard;