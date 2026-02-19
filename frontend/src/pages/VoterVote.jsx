import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function VoterVote() {
  const loc = useLocation();
  const nav = useNavigate();
  const { tx_hash } = loc.state || {};

  if (!tx_hash) {
    return <p style={{ color: "white" }}>No vote data found</p>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 480 }}>
        <CardContent>
          <h2>✅ Vote Successful</h2>

          <p style={{ wordBreak: "break-all", fontSize: 12 }}>
            Tx Hash: {tx_hash}
          </p>

          <a
            href={`https://amoy.polygonscan.com/tx/${tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full" style={{ marginTop: 10 }}>
              View on PolygonScan
            </Button>
          </a>

          <Button
            variant="outline"
            className="w-full"
            style={{ marginTop: 10 }}
            onClick={() => nav("/admin/dashboard")}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
