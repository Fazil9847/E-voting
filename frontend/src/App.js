import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

import Landing from "./pages/Landing";
import VoterLogin from "./pages/VoterLogin";
import VoterOTP from "./pages/VoterOTP";
import VoterQR from "./pages/VoterQR";
import VoterVote from "./pages/VoterVote";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminScanQR from "./pages/AdminScanQR";
import AdminVote from "./pages/AdminVote";
import AdminResults from "./pages/AdminResults";
import PublicResults from "./pages/PublicResults";
// import AdminVoterPreview from "./pages/AdminVoterPreview";
import AdminFaceDemo from "./pages/AdminFaceDemo";

export default function App() {
  return (
 <> 

    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/voter/login" element={<VoterLogin />} />
        <Route path="/voter/otp" element={<VoterOTP />} />
        <Route path="/voter/qr" element={<VoterQR />} />
        <Route path="/voter/vote" element={<VoterVote />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/scan" element={<AdminScanQR />} />
        <Route path="/admin/vote" element={<AdminVote />} />
        <Route path="/admin/results/:id" element={<AdminResults />} />
       <Route path="/results/:id" element={<PublicResults />} />

        <Route path="/admin/preview" element={<AdminVoterPreview />} />
        {/* <Route path="/admin/face-scan" element={<AdminFaceDemo />} /> */}
      </Routes>
      <Toaster position="top-center" richColors />
    </div>
    </>
  );
}
