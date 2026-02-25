import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const API =
  `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;
const BASE =
  `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}`;

export default function AdminVote() {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, election } = location.state || {};

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH CANDIDATES ================= */
 useEffect(() => {
  if (!election) return;

  const token = localStorage.getItem("admin_token");

  fetch(`${API}/elections/${election.electionId}/candidates`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => res.json())
    .then(data => setCandidates(Array.isArray(data) ? data : []))
    .catch(() => setCandidates([]));
}, [election]);


  /* ================= CAST VOTE ================= */
  const castVote = async () => {
  if (loading) return;  // ⭐ ADD THIS

  if (!selectedCandidateId) {
    alert("Please select a candidate");
    return;
  }
  if (!selectedCandidateId) {
  alert("Please select a candidate");
  return;
}

if (!window.confirm("Confirm vote for this candidate?")) {
  return;
}

  setLoading(true);


    try {
      const res = await fetch(`${API}/votes/cast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterId: student.voterId,
          candidateId: selectedCandidateId, // ✅ candidateId (NOT _id)
          electionId: election.electionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Vote failed");
        setLoading(false);
        return;
      }

      navigate("/voter/vote", {
        state: {
          tx_hash: data.txHash,
          election,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Vote failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= GUARDS ================= */
  if (!student || !election) {
    return (
      <div style={{ padding: 20, color: "white" }}>
        No voter or election loaded
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* 👤 VOTER CARD */}
        <Card>
          <CardContent style={{ textAlign: "center" }}>
            <h3>{student.name}</h3>
            <p style={{ color: "#6B7280" }}>{student.voterId}</p>

            {student.photo && (
              <img
                src={`${BASE}${student.photo}`}
                alt="Voter"
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginTop: 12,
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* 🗳️ CANDIDATES */}
        <Card style={{ marginTop: 16 }}>
          <CardContent>
            <h3>{election.title}</h3>

            {candidates.length === 0 && (
              <p style={{ color: "#6B7280", marginTop: 12 }}>
                No candidates available
              </p>
            )}

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {candidates.map((c) => (
                <label
                  key={c.candidateId} // ✅ candidateId
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 10,
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="candidate"
                    disabled={loading}  // ⭐ ADD
                    checked={selectedCandidateId === c.candidateId}
                    onChange={() =>
                      setSelectedCandidateId(c.candidateId)
                    }
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ color: "#6B7280" }}>{c.party}</div>
                  </div>
                </label>
              ))}
            </div>

            <Button
              className="w-full"
              style={{ marginTop: 16 }}
              onClick={castVote}
              disabled={loading}
            >
              {loading ? "Casting Vote..." : "Cast Vote"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
