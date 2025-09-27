// import React from "react";
// import { Routes, Route, Router } from "react-router-dom";
// import Login from "./components/Login";
// import CaregiverDashboard from "./components/CaregiverDashboard";
// import ClinicianDashboard from "./components/ClinicianDashboard";
// import AdminDashboard from "./components/AdminDashboard";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/caregiver" element={<CaregiverDashboard />} />
//         <Route path="/clinician" element={<ClinicianDashboard />} />
//         <Route path="/admin" element={<AdminDashboard />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

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
