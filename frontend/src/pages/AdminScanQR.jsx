import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from "@zxing/browser";

const API =
  `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminScanQR() {
  const nav = useNavigate();
  const loc = useLocation();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode"); // ✅ face or null
  const { election } = loc.state || {};
  const videoRef = useRef(null);




useEffect(() => {
  if (!election || !election.isActive) {
    toast.error("Election is not active");
    nav("/admin/dashboard");
    return;
  }

  let controls = null;
  let cancelled = false;
const codeReader = new BrowserMultiFormatReader(undefined, {
  delayBetweenScanAttempts: 20
});

  const stopEverything = () => {
    if (controls) {
      try { controls.stop(); } catch {}
      controls = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startScanner = async () => {
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length || cancelled) return;

      controls = await codeReader.decodeFromVideoDevice(
        devices[0].deviceId,
        videoRef.current,
        async (result) => {
          if (!result) return;

          const text = result.getText();
          stopEverything();

          toast.success("QR scanned");

          const res = await fetch(`${API}/voters/validate-qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: text,
              electionId: election.electionId
            })
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data.message || "Invalid QR");
            if (!cancelled) startScanner();
            return;
          }

          if (mode === "face") {
            nav("/admin/face-scan", {
              state: { student: data, election }
            });
          } else {
            nav("/admin/preview", {
              state: { student: data, election }
            });
          }
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Camera start failed");
    }
  };

  startScanner();

  return () => {
    cancelled = true;  // 🔥 prevents second mount conflict
    stopEverything();
  };

}, [election]);





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
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  style={{ width: "100%", borderRadius: 12 }}
/>
          <Button
            variant="outline"
            className="w-full"
            style={{ marginTop: 12 }}
onClick={() => {
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