// frontend/src/components/AddCandidateForm.jsx
import React, { useState } from "react";

export default function AddCandidateForm({ onAdded, electionId }) 

 {
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !candidateId.trim()) {
      setError("Name and Candidate ID are required.");
      return;
    }

   const payload = {
  name: name.trim(),
  party: party.trim() || undefined,

  candidateId: candidateId.trim(),

  // ✅ REQUIRED
  electionId
};

    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");

const res = await fetch("http://localhost:5000/api/candidates", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(payload),
});

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add candidate");

      setSuccess("Candidate added successfully.");
      setName(""); setParty(""); setManifesto(""); setCandidateId("");
      if (onAdded) onAdded(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, padding: 12 }}>
      <h3>Add Candidate</h3>
      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}

      <div style={{ marginBottom: 8 }}>
        <label>Name *</label><br />
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Party</label><br />
        <input value={party} onChange={(e) => setParty(e.target.value)} />
      </div>

     

      <div style={{ marginBottom: 8 }}>
        <label>Candidate ID *</label><br />
        <input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} required />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Candidate"}
      </button>
    </form>
  );
}
