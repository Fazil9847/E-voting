import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function VoterLogin() {
  const navigate = useNavigate();
  const [admission, setAdmission] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!admission.trim() || !password.trim()) {
      toast.error("Enter Admission Number and Password");
      return;
    }

    const voterId = admission.trim().toUpperCase();
    console.log("API URL:", API);

    try {
      // 🔐 Step 1: Password Login
  // 🔐 Step 1: Password Login
const loginRes = await fetch(`${API}/voters/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ voterId, password })
});

// Read raw response first
const rawText = await loginRes.text();

let loginData = {};

try {
  loginData = rawText ? JSON.parse(rawText) : {};
} catch (err) {
  toast.error("Server error");
  return;
}

console.log("Login status:", loginRes.status);
console.log("Login response:", loginData);

if (!loginRes.ok) {
  toast.error(loginData.message || "Invalid credentials");
  return;
}


      toast.success("Login successful!");


     // 📱 Step 2: Get Existing QR (Do NOT generate new one)
const qrRes = await fetch(`${API}/voters/get-existing-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ voterId })
      });

      const qrData = await qrRes.json();

     if (!qrRes.ok) {
  toast.error(qrData.message || "QR not available");
  return;
}
      // 🚀 Step 3: Navigate to QR page
      navigate("/voter/qr", {
        state: {
          qr_token: qrData.qrToken,
          admission_no: voterId
        }
      });

    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 520 }} className="glass">
        <CardContent>
          <h2 style={{ fontFamily: "Space Grotesk", marginBottom: 8 }}>
            Voter Login
          </h2>

          <Label>Admission Number</Label>
          <Input
            placeholder="Admission number"
            value={admission}
            onChange={(e) => setAdmission(e.target.value.toUpperCase())}
          />

          <div style={{ marginTop: 12 }}>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <Button className="w-full" onClick={handleLogin}>
              Login & Get QR
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}