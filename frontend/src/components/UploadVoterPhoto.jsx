import React, { useState } from "react";

export default function UploadVoterPhoto() {
  const [voterId, setVoterId] = useState("");
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState("");
const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

  const upload = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!voterId || !photo) {
      setMsg("Voter ID and photo required");
      return;
    }

    const formData = new FormData();
    formData.append("voterId", voterId);
    formData.append("photo", photo);

    const res = await fetch(`${API}/voters/upload-photo`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message);
    } else {
      setMsg("Photo uploaded successfully ✅");
      setVoterId("");
      setPhoto(null);
    }
  };

  return (
    <form onSubmit={upload}>
      <h3>Upload / Update Voter Photo</h3>

      {msg && <p>{msg}</p>}

      <input
        placeholder="Voter ID"
        value={voterId}
        onChange={(e) => setVoterId(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files[0])}
      />

      <button type="submit">Upload Photo</button>
    </form>
  );
}
