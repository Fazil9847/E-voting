// frontend/src/components/AddVoterForm.jsx
import React, { useState } from "react";

export default function AddVoterForm({ onAdded }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [voterId, setVoterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [photo, setPhoto] = useState(null);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (!name.trim() || !voterId.trim()) {
    setError("Name and Voter ID are required.");
    return;
  }

  setLoading(true);

  try {
    // 1️⃣ CREATE VOTER (JSON)
    const voterPayload = {
      name: name.trim(),
      email: email.trim(),
      age: age ? Number(age) : undefined,
      voterId: voterId.trim()
    };

    const voterRes = await fetch("http://localhost:5000/api/voters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voterPayload)
    });

    const voterData = await voterRes.json();
    if (!voterRes.ok) {
      throw new Error(voterData.message || "Failed to add voter");
    }

    // 2️⃣ UPLOAD PHOTO (FormData)
    if (photo) {
      const formData = new FormData();
      formData.append("voterId", voterId.trim());
      formData.append("photo", photo);

      const photoRes = await fetch(
        "http://localhost:5000/api/voters/upload-photo",
        {
          method: "POST",
          body: formData
        }
      );

      const photoData = await photoRes.json();
      if (!photoRes.ok) {
        throw new Error(photoData.message || "Photo upload failed");
      }
    }

    setSuccess("Voter added successfully");
    setName("");
    setEmail("");
    setAge("");
    setVoterId("");
    setPhoto(null);

    if (onAdded) onAdded(voterData);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, padding: 12 }}>
      <h3>Add Voter</h3>
      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}

      <div style={{ marginBottom: 8 }}>
        <label>Name *</label><br />
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Voter ID *</label><br />
        <input value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Email</label><br />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Age</label><br />
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="1" />
      </div>
      <div style={{ marginBottom: 8 }}>
  <label>Photo</label><br />
  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
</div>

      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Voter"}
      </button>
    </form>
  );
}
