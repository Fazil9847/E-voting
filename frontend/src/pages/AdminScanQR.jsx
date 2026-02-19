import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

const API =
  `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminScanQR() {
  const nav = useNavigate();
  const loc = useLocation();
  const { election } = loc.state || {};

  const scannerRef = useRef(null);

  useEffect(() => {
    if (!election) return;

    // 🧹 Clean container (prevents duplication)
    const el = document.getElementById("qr-reader");
    if (el) el.innerHTML = "";

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: false
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        try {
          scanner.clear();
        } catch { }

        toast.success("QR scanned");

        try {
          const res = await fetch(`${API}/voters/validate-qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: decodedText,
              electionId: election.electionId
            })
          });


          const data = await res.json();
          if (!res.ok) {
            toast.error(data.message || "Invalid QR");
            return;
          }

          nav("/admin/preview", {
            state: { student: data, election }
          });

        } catch {
          toast.error("Server error");
        }
      },
      () => { }
    );

    return () => {
      try {
        scanner.clear();
      } catch { }
    };
  }, [election, nav]);

  if (!election) {
    return <div style={{ padding: 20 }}>No election selected</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Card style={{ width: 520 }}>
        <CardContent>
          <h2>Scan QR – {election.title}</h2>

          {/* ✅ THIS IS REQUIRED */}
          <div
            id="qr-reader"
            style={{ width: "100%", minHeight: 320 }}
          />

          <Button
            variant="outline"
            className="w-full"
            style={{ marginTop: 12 }}
            onClick={() => {
              try {
                scannerRef.current?.clear();
              } catch { }
              nav("/admin/dashboard");
            }}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
