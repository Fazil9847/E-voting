import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminScanQR() {
  const loc = useLocation();
  const nav = useNavigate();
  const { election } = loc.state || {};

  useEffect(() => {
    if (!election) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        toast.success("QR scanned successfully");

        try {
          // 🔐 Validate QR with backend
          const res = await fetch(`${API}/voters/validate-qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: decodedText })
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data.message || "Invalid QR");
            return;
          }

          // ✅ Valid voter → go to vote screen
          nav("/admin/vote", {
            state: {
              session_token: decodedText,
              student: data,
              election
            }
          });

        } catch (err) {
          toast.error("Server error while validating QR");
        }
      },
      (error) => {
        // ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [election, nav]);

  if (!election) {
    return <div style={{ color: "white", padding: 20 }}>No election selected</div>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 520 }}>
        <CardContent>
          <h2>Scan QR for {election.title}</h2>

          {/* 🔲 Camera scanner */}
          <div id="qr-reader" style={{ width: "100%", marginTop: 16 }} />

          <Button
            variant="outline"
            className="w-full"
            style={{ marginTop: 12 }}
            onClick={() => nav("/admin/dashboard")}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
