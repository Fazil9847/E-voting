/* eslint-disable */


import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function VoterOTP() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = loc.state || {};
  const { admission_no, election_id, otp, name, email } = state;

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  // If opened directly or missing required state, redirect safely after mount
  useEffect(() => {
    if (!admission_no) {
      console.warn("VoterOTP: missing admission_no — redirecting to login");
      nav("/voter/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!admission_no) return null;

const verify = async () => {
  if (!value.trim()) {
    toast.error("Enter OTP");
    return;
  }

  setLoading(true);

  try {
    // STEP 1: Verify OTP with backend
    const verifyRes = await fetch(`${API}/voters/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voterId: admission_no,
        code: value.trim()
      })
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      toast.error(verifyData.message || "Invalid OTP");
      setLoading(false);
      return;
    }

    toast.success("OTP verified!");

    // STEP 2: Generate QR token
    const qrRes = await fetch(`${API}/voters/generate-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: admission_no })
    });

    const qrData = await qrRes.json();
    if (!qrRes.ok) {
      toast.error(qrData.message || "QR generation failed");
      setLoading(false);
      return;
    }

    const qrToken = qrData.qrToken;

    // STEP 3: Redirect to QR screen
    nav("/voter/qr", {
      state: {
        qr_token: qrToken,
        admission_no,
        name,
        email
      }
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    toast.error("Server error");
  }

  setLoading(false);
};

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 520 }}>
        <CardHeader>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Verify OTP</div>
        </CardHeader>

        <CardContent>
        <div style={{ marginBottom: 12, background: "#DBEAFE", padding: 12, borderRadius: 8 }}>
  An OTP has been sent to your email: <strong>{email}</strong>
</div>


          <Label>OTP</Label>
          <Input
            placeholder="000000"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          />

          <div style={{ marginTop: 16 }}>
            <Button className="w-full" onClick={verify} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
