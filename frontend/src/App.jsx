import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import CaregiverDashboard from "./components/CaregiverDashboard";
import ClinicianDashboard from "./components/ClinicianDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/caregiver" element={<CaregiverDashboard />} />
        <Route path="/clinician" element={<ClinicianDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
