import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminVote() {
  const loc = useLocation();
  const nav = useNavigate();
  const { student, election } = loc.state || {};

  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!election) return;

    const token = localStorage.getItem("admin_token");

    fetch(`${API}/elections/${election.id}/candidates`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(() => setCandidates([]));
  }, [election]);

  if (!student) {
    return <div style={{ color: "white", padding: 20 }}>No voter loaded</div>;
  }

  const cast = () => {
    if (!selected) return;

    nav("/voter/vote", {
      state: {
        voter: student,
        candidateId: selected,
        election
      }
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* 👤 VOTER CARD */}
<Card>
  <CardContent>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 8
      }}
    >
      {/* Name */}
      <h3 style={{ margin: 0 }}>{student.name}</h3>

      {/* Voter ID */}
      <p style={{ margin: 0, color: "#6B7280" }}>
        {student.voterId}
      </p>

      {/* Photo */}
      {student.photo && (
        <img
          src={`http://localhost:5000${student.photo}`}
          alt="Voter"
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            objectFit: "cover",
            marginTop: 12
          }}
        />
      )}
    </div>
  </CardContent>
</Card>



        {/* 🗳️ CANDIDATES */}
        <Card style={{ marginTop: 16 }}>
          <CardContent>
            <h3>{election.title}</h3>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {candidates.map(c => (
                <label
                  key={c._id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 10,
                    border: "1px solid #E5E7EB",
                    borderRadius: 8
                  }}
                >
                  <input
                    type="radio"
                    name="candidate"
                    onChange={() => setSelected(c._id)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ color: "#6B7280" }}>{c.party}</div>
                  </div>
                </label>
              ))}
            </div>

            <Button className="w-full" style={{ marginTop: 12 }} onClick={cast}>
              Cast Vote
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
