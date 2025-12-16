import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

export default function AdminResults() {
  const { id } = useParams();
  const nav = useNavigate();

  // Mock results
  const results = [
    { candidate: { id: 1, name: "Anokh" }, votes: 45 },
    { candidate: { id: 2, name: "Niyas" }, votes: 30 },
    { candidate: { id: 3, name: "Amurtha Varshini" }, votes: 20 }
  ];
  const total = results.reduce((s, r) => s + r.votes, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Button variant="outline" onClick={() => nav("/admin/dashboard")}>Back</Button>

        <Card style={{ marginTop: 12 }}>
          <CardContent>
            <h2>Results — {id}</h2>
            <p>Total votes: {total}</p>

            <div style={{ marginTop: 12 }}>
              {results.map((r, i) => {
                const pct = total ? Math.round((r.votes / total) * 100) : 0;
                return (
                  <div key={r.candidate.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>{i + 1}. {r.candidate.name}</div>
                      <div>{r.votes} ({pct}%)</div>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
