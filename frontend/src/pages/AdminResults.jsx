import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

const API =
  `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api`;

export default function AdminResults() {
  const { id } = useParams();
  const nav = useNavigate();

  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function Spinner() {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
        <div className="spinner"></div>
      </div>
    );
  }

  /* ================= LOAD RESULTS ================= */

  const loadResults = () => {
    const token = localStorage.getItem("admin_token");

    fetch(`${API}/results/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
          setResults([]);
          setTotalVotes(0);
          return;
        }

        setError("");

        const list = Array.isArray(data.results) ? data.results : [];
        setResults(list);

        const total = list.reduce((sum, r) => sum + r.votes, 0);
        setTotalVotes(total);
      })
      .catch(() => setError("Failed to load results"));
  };

  useEffect(() => {
    loadResults();
  }, [id]);

  /* ================= PUBLISH ================= */

  const publishResults = async () => {
    const token = localStorage.getItem("admin_token");

    try {
      setLoading(true);

      const res = await fetch(`${API}/results/publish/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Results published successfully (Fast mode)");

      loadResults(); // ⭐ refresh instantly
    } catch {
      alert("Publish failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORCE ================= */

  const forcePublish = async () => {
    const token = localStorage.getItem("admin_token");

    if (!window.confirm("This will recompute ALL votes from blockchain. Continue?"))
      return;

    try {
      setLoading(true);

      const res = await fetch(
        `${API}/results/publish/${id}?force=true`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Full recount completed (Blockchain verified)");

      loadResults(); // ⭐ refresh instantly
    } catch {
      alert("Force recount failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Button
          style={{ margin: 12 }}
          variant="outline"
          onClick={() => nav("/admin/dashboard")}
        >
          Back to Dashboard
        </Button>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <Button onClick={publishResults} disabled={loading}>
            {loading ? "Publishing..." : "Publish (Fast)"}
          </Button>

          <Button
            variant="destructive"
            onClick={forcePublish}
            disabled={loading}
          >
            {loading ? "Processing..." : "Force Recount (Blockchain)"}
          </Button>
        </div>

        <Card style={{ marginTop: 16 }}>
          <CardContent>
            <h2>Election Results</h2>

            {loading && <Spinner />}

            {!loading && error && (
              <p style={{ color: "red" }}>{error}</p>
            )}

            {!loading && !error && (
              <>
                <p>Total Votes: {totalVotes}</p>

                {results.map((r, i) => {
                  const pct =
                    totalVotes > 0
                      ? Math.round((r.votes / totalVotes) * 100)
                      : 0;

                  return (
                    <div key={r.candidateId} style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          {i + 1}. {r.name} ({r.party})
                        </div>

                        <div>
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
