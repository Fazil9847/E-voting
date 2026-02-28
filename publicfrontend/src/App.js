import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import VoterLogin from "./pages/VoterLogin";
import VoterQR from "./pages/VoterQR";
import PublicResults from "./pages/PublicResults";
import "./App.css";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/voter/login" element={<VoterLogin />} />
        <Route path="/voter/qr" element={<VoterQR />} />
        <Route path="/results/:id" element={<PublicResults />} />
      </Routes>
       <Toaster position="top-center" richColors />
    </Router>
  );
}

export default App;