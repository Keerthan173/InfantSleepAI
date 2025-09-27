// // This will just show alerts (from /alerts endpoint).

import React, { useEffect, useState } from "react";
import axios from "axios";

const CaregiverDashboard = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/alerts?limit=10");
        setAlerts(res.data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Caregiver Dashboard</h2>
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Timestamp</th>
            <th>Prediction</th>
            <th>Confidence</th>
          </tr>
        </thead>
        {/* <tbody>
          {alerts.map((alert, idx) => (
            <tr key={idx}>
              <td>{alert.timestamp}</td>
              <td>{alert.prediction}</td>
              <td>{alert.confidence.toFixed(2)}</td>
            </tr>
          ))}
        </tbody> */}
      </table>
    </div>
  );
};

export default CaregiverDashboard;
