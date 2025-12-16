import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function VoterQR() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = loc.state || {};
  const { qr_token, admission_no, name, email } = state;

  const [qrUrl, setQrUrl] = useState("");

  // Safe redirect and URL setup
  useEffect(() => {
    if (!qr_token) {
      console.warn("VoterQR: missing qr_token — redirecting to login");
      nav("/voter/login");
      return;
    }
    setQrUrl(`${API}/voter/qr-code/${encodeURIComponent(qr_token)}`);
  }, [qr_token, nav]);

  // return null while redirecting
  if (!qr_token) return null;

  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error("Failed to fetch QR image");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-${admission_no || "voter"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      toast.success("QR downloaded!");
    } catch (err) {
      console.error("downloadQR error:", err);
      toast.error("Download failed");
    }
  };

  return (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Card style={{ width: 520 }}>
      <CardHeader>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Your QR Code</div>
      </CardHeader>

      <CardContent>

        {/* QR Image */}
        {qrUrl && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <img
              src={qrUrl}
              alt="Voting QR Code"
              style={{ width: 260, height: 260, display: "inline-block" }}
            />
          </div>
        )}

        {/* QR Token Text */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#F3F4F6",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 14,
            wordBreak: "break-all",
            textAlign: "center"
          }}
        >
          <strong>QR Token:</strong>
          <br />
          {qr_token}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <Button onClick={downloadQR} className="w-full">Download QR Code</Button>
          <Button variant="outline" onClick={() => nav("/")}>Return Home</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

}
