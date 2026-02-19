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
const handleLogin = async () => {
  if (!admission.trim()) {
    toast.error("Enter Admission Number");
    return;
  }

  const voterId = admission.trim().toUpperCase();

  try {
    // Step 1: Check voter exists
    const res = await fetch(`${API}/voters`);
    const voters = await res.json();

    const found = voters.find(v => (v.voterId || "").toUpperCase() === voterId);

    if (!found) {
      toast.error("Voter not found in database");
      return;
    }

    // Step 2: Request OTP from backend
    const otpRes = await fetch(`${API}/voters/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId })
    });

    const otpData = await otpRes.json();

    if (!otpRes.ok) {
      toast.error(otpData.message || "Failed to request OTP");
      return;
    }

    toast.success("OTP sent to email!");

    // Step 3: Move to OTP page WITHOUT providing OTP (backend handles it)
    navigate("/voter/otp", {
      state: {
        admission_no: voterId,
        election_id: "election-2025-01",
        name: found.name,
        email: found.email
      }
    });

  } catch (err) {
    console.error(err);
    toast.error("Server error");
  }
};


  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 520 }} className="glass">
        <CardContent>
          <h2 style={{ fontFamily: "Space Grotesk", marginBottom: 8 }}>Voter Login</h2>

          <Label>Admission Number</Label>
          <Input
            placeholder="admission number"
            value={admission}
            onChange={(e) => setAdmission(e.target.value.toUpperCase())}
          />

          <div style={{ marginTop: 16 }}>
            <Button className="w-full" onClick={handleLogin}>
              OTP Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
