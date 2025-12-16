import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function VoterVote() {
  const loc = useLocation();
  const nav = useNavigate();
  const { tx_hash, election } = loc.state || {};

  if (!tx_hash) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "white" }}>No vote data found</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 560 }}>
        <CardContent>
          <h2 style={{ marginBottom: 8 }}>Vote Recorded</h2>
          <p>Your vote for <strong>{election?.title || "Election"}</strong> has been recorded.</p>
          <p style={{ marginTop: 12, fontFamily: "monospace", wordBreak: "break-all" }}>{tx_hash}</p>
          <div style={{ marginTop: 16 }}>
            <Button className="w-full" onClick={() => nav("/verify", { state: { tx_hash } })}>
              Verify Transaction
            </Button>
            <Button variant="outline" className="w-full" onClick={() => nav("/")}>
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
