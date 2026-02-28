import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

const API = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function PublicResults() {
  const { id } = useParams();
  const nav = useNavigate();

  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState(id || "");
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load elections for dropdown
  useEffect(() => {
    fetch(`${API}/results/public-elections`)
      .then(res => res.json())
    .then(data => {
  setElections(Array.isArray(data) ? data : []);
})
      .catch(() => setError("Failed to load elections"));
  }, []);

  // Load results
  useEffect(() => {
    if (!selectedId) return;

     setLoading(true);

    fetch(`${API}/results/public/${selectedId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
          setResults([]);
          setTotalVotes(0);
          return;
        }

        setError("");
        setResults(data.results || []);

        const total = (data.results || []).reduce(
          (sum, r) => sum + r.votes,
          0
        );

        setTotalVotes(total);
      })
      .catch(() => setError("Failed to load results"))
       .finally(() => setLoading(false));  
  }, [selectedId]);

  // Find winner
  const winner = results.reduce(
    (max, r) => (r.votes > (max?.votes || 0) ? r : max),
    null
  );

  return (
    <div
      style={{
        padding: 40,
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f0f4f8,#e2ecf3)",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <div style={{ width: "100%", maxWidth: 760 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontWeight: 600 }}>Public Election Results</h2>

          <Button
            variant="secondary"
            onClick={() => nav("/")}
            style={{ background: "black", color: "white" }}
          >
            Back to Home
          </Button>
        </div>

        {/* Main Card */}
        <Card
          style={{
            borderRadius: 16,
            padding: 20,
            background: "#e6f0f2",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
          }}
        >
          <CardContent>

            {/* Dropdown */}
            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <label style={{ marginRight: 10, fontWeight: 500 }}>
                Select Election:
              </label>
<select
  disabled={loading}   // ⭐ ADD HERE
  value={selectedId}
  onChange={e => {
    const val = e.target.value;
    setError("");
    setSelectedId(val);
    nav(`/results/${val}`);
  }}
  style={{
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
    minWidth: 280
  }}
>
                <option value="">-- Select Election --</option>
               {Array.isArray(elections) && elections.map(e => (
                  <option key={e.electionId} value={e.electionId}>
                    {e.title} ({new Date(e.endedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
{loading && (
  <div style={{ textAlign: "center", marginBottom: 20 }}>
    <div className="spinner"></div>
  </div>
)}

{error && <p style={{ color: "red" }}>{error}</p>} 
           {!error && !loading && selectedId && (
              <>
                <h3 style={{ textAlign: "center", marginBottom: 20 }}>
                  Total Votes: {totalVotes}
                </h3>

                  {results.length === 0 && (
      <p style={{ textAlign: "center", marginBottom: 20 }}>
        No votes recorded yet.
      </p>
    )}

                {/* Winner Highlight */}
                {winner && (
                  <div
                    style={{
                      background: "linear-gradient(90deg,#FFD700,#FFC107)",
                      padding: 14,
                      borderRadius: 10,
                      marginBottom: 18,
                      textAlign: "center",
                      fontWeight: 600,
                      color: "#333"
                    }}
                  >
                    🏆 Winner: {winner.name} ({winner.party}) — {winner.votes} votes
                  </div>
                )}

                {/* Results List */}
                {results.map((r, i) => {
                  const pct =
                    totalVotes > 0
                      ? Math.round((r.votes / totalVotes) * 100)
                      : 0;

                  return (
                    <div
                      key={r.candidateId}
                      style={{
                        marginBottom: 14,
                        padding: 12,
                        borderRadius: 10,
                        background: "white",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>
                          {i + 1}. {r.name} ({r.party})
                        </div>

                        <div style={{ fontWeight: 500 }}>
                          {r.votes} ({pct}%)
                        </div>
                      </div>

                      <Progress value={pct} />
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
