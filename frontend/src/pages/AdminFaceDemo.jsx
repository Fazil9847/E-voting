import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BASE_URL}/api`;
export default function AdminFaceScan() {
  const { state } = useLocation();
  const navigate = useNavigate();

console.log("Admin token:", localStorage.getItem("admin_token"));
useEffect(() => {
  const verifyAdmin = async () => {
    const token = localStorage.getItem("admin_token");

    console.log("Token:", token);

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const res = await fetch(`${API}/admin/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Admin/me status:", res.status);

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      console.log("Admin/me data:", data);

    } catch (err) {
      console.log("Auth error:", err);
      localStorage.removeItem("admin_token");
      navigate("/admin/login");
    }
  };

  verifyAdmin();
}, [navigate]);


  const storedDescriptorRef = useRef(null);
const intervalRef = useRef(null);
const [storedReady, setStoredReady] = useState(false);
const tinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,   // 160–416 (lower = faster)
  scoreThreshold: 0.5
});
const student = state?.student;
const election = state?.election;

useEffect(() => {
  if (!student || !election) {
    navigate("/admin/dashboard");
  }
}, [student, election, navigate]);

if (!student || !election) {
  return null;
}
 
console.log("FaceScan state:", state);
console.log("Photo URL:", `${BASE_URL}${student.photo}`);

  const videoRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [distance, setDistance] = useState(null);
  const [result, setResult] = useState("");
  const streamRef = useRef(null);
  const [matched, setMatched] = useState(false);
  const [status, setStatus] = useState("idle"); 
// "idle" | "scanning" | "match" | "mismatch"
const timeoutRef = useRef(null);
  const autoTimeoutRef = useRef(null);
  const matchedRef = useRef(false);


const stopCamera = () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }

  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.srcObject = null;
  }
};

  // Load AI models
useEffect(() => {
  const loadModels = async () => {
    try {
      console.log("Loading models...");
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      console.log("Models loaded");
      setModelsLoaded(true);
    } catch (err) {
      console.error("Model loading failed:", err);
    }
  };

  loadModels();
}, []);useEffect(() => {
  const loadStoredFace = async () => {
    if (!student?.photo || !modelsLoaded) return;

    const img = await faceapi.fetchImage(`${BASE_URL}${student.photo}`);


const detection = await faceapi
  .detectSingleFace(img, tinyOptions)
  .withFaceLandmarks()
  .withFaceDescriptor();

    if (detection) {
      storedDescriptorRef.current = detection.descriptor;
      setStoredReady(true);   // 🔥 IMPORTANT
      console.log("Stored face descriptor loaded");
    }
  };

  loadStoredFace();
}, [modelsLoaded]);


useEffect(() => {
 if (!modelsLoaded || !storedReady) return;
  setResult("Scanning face...");
  setStatus("scanning");


  // 🔐 Start 10-second auto timeout
autoTimeoutRef.current = setTimeout(() => {
  if (!matchedRef.current) {
    stopCamera();
    setStatus("mismatch");
    setResult("Verification Timeout ❌ Please Rescan QR");
    
    setTimeout(() => {
      navigate("/admin/scan?mode=face", { state: { election } });
    }, 1500);
  }
}, 15000);


intervalRef.current = setInterval(async () => {

  if (!videoRef.current) return;

  // 🔥 ADD THIS LINE HERE
  if (videoRef.current.readyState !== 4) return;

  const liveDetection = await faceapi
    .detectSingleFace(videoRef.current, tinyOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();


if (!liveDetection) {
  setStatus("mismatch");
  return;
}

    const dist = faceapi.euclideanDistance(
      storedDescriptorRef.current,
      liveDetection.descriptor
    );

    setDistance(dist);


if (dist < 0.48 && !matched) {
  setMatched(true);
matchedRef.current = true;

  // 🔥 STOP AUTO TIMEOUT
  if (autoTimeoutRef.current) {
    clearTimeout(autoTimeoutRef.current);
    autoTimeoutRef.current = null;
  }

  setStatus("match");
  setResult("Face Matched ✅ Redirecting...");


  // ⏳ Wait 2 seconds before navigating
 timeoutRef.current = setTimeout(() => {
      stopCamera(); // stop camera immediately
  navigate("/admin/vote", {
    state: { student, election }
  });
}, 1000);
  return;
} else {
  setStatus("mismatch");
}
  }, 600); // check every 0.6 seconds

return () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  if (autoTimeoutRef.current) {
    clearTimeout(autoTimeoutRef.current);
  }
};
}, [modelsLoaded, storedReady]);

  // Start camera
useEffect(() => {
  if (!modelsLoaded) return;

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  startVideo();

  // 🔥 THIS IS THE IMPORTANT PART
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

}, [modelsLoaded]);

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Face Verification</h2>

      {student?.photo && (
        <img
          src={`${BASE_URL}${student.photo}`}
          alt="Stored"
          width="200"
          style={{ marginBottom: "20px" }}
        />
      )}

      <br />
<video
  ref={videoRef}
  autoPlay
  muted
  width="400"
  height="300"
  style={{
    border:
      status === "match"
        ? "4px solid #22c55e"
        : status === "mismatch"
        ? "4px solid #ef4444"
        : "4px solid #000",
    borderRadius: "12px",
    transition: "border 0.3s ease"
  }}
/>

      <br /><br />

      {/* <button onClick={verifyFace}>Verify Face</button> */}

      {distance !== null && <p>Distance: {distance.toFixed(4)}</p>}
      <h3>{result}</h3>
{/* 
      {result.includes("Matched") && (
      <button
  onClick={() => {
    stopCamera();   // 🔥 STOP CAMERA FIRST
    navigate("/admin/vote", { state: { student, election } });
  }}
>
        
          Proceed to Vote
        </button>
      )} */}
    </div>
  );
}