import React, { useEffect } from "react";

export default function ConnectionTest() {
  useEffect(() => {
    fetch("http://localhost:5000/api/voters")
      .then((res) => res.json())
      .then((data) => console.log("🔥 Backend Connected! Data:", data))
      .catch((err) => console.error("❌ Backend Connection Error:", err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Testing Backend Connection...</h2>
      <p>Check your browser console (F12 → Console)</p>
    </div>
  );
}
